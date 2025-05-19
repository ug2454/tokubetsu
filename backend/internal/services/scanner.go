package services

import (
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/net/html"
)

type AccessibilityCheck struct {
	ID          string   `json:"id"`
	Impact      string   `json:"impact"`
	Description string   `json:"description"`
	Help        string   `json:"help"`
	HelpURL     string   `json:"helpUrl"`
	Nodes       []string `json:"nodes"`
}

type ScanResult struct {
	Passes     []AccessibilityCheck `json:"passes"`
	Violations []AccessibilityCheck `json:"violations"`
}

type Scanner struct {
	client *http.Client
}

// Track global heading hierarchy
var headingLevels []int

func NewScanner() *Scanner {
	return &Scanner{
		client: &http.Client{},
	}
}

func (s *Scanner) ScanURL(url string) (*ScanResult, error) {
	// Fetch the page
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Parse HTML
	doc, err := html.Parse(strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	result := &ScanResult{
		Passes:     make([]AccessibilityCheck, 0),
		Violations: make([]AccessibilityCheck, 0),
	}

	// Reset heading levels for each scan
	headingLevels = make([]int, 0)

	// Perform accessibility checks
	s.checkImages(doc, result)
	s.checkHeadings(doc, result)
	s.checkForms(doc, result)
	s.checkLinks(doc, result)
	s.checkARIA(doc, result)
	s.checkLandmarks(doc, result)
	s.checkColorContrast(doc, result)
	s.checkTargetSize(doc, result)

	return result, nil
}

func (s *Scanner) checkImages(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode && n.Data == "img" {
		var alt string
		for _, attr := range n.Attr {
			if attr.Key == "alt" {
				alt = attr.Val
				break
			}
		}

		if alt == "" {
			result.Violations = append(result.Violations, AccessibilityCheck{
				ID:          "image-alt",
				Impact:      "critical",
				Description: "Image is missing alt text",
				Help:        "Images must have alternate text",
				HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/image-alt",
				Nodes:       []string{getNodeHTML(n)},
			})
		} else {
			result.Passes = append(result.Passes, AccessibilityCheck{
				ID:          "image-alt",
				Description: "Image has appropriate alt text",
				Nodes:       []string{getNodeHTML(n)},
			})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkImages(c, result)
	}
}

func (s *Scanner) checkHeadings(n *html.Node, result *ScanResult) {
	// Only match h1-h6 elements specifically, not html, head, etc.
	if n.Type == html.ElementNode && len(n.Data) == 2 && n.Data[0] == 'h' {
		level := n.Data[1:]
		// Ensure it's a valid heading level (1-6)
		if level >= "1" && level <= "6" {
			currentLevel, _ := strconv.Atoi(level)

			// Get heading text for context
			var headingText string
			for c := n.FirstChild; c != nil; c = c.NextSibling {
				if c.Type == html.TextNode {
					headingText += c.Data
				}
			}
			headingText = strings.TrimSpace(headingText)

			// Check for global heading hierarchy issues
			if len(headingLevels) > 0 {
				lastLevel := headingLevels[len(headingLevels)-1]

				// Headings should only increase by one level at a time
				if currentLevel > lastLevel+1 {
					result.Violations = append(result.Violations, AccessibilityCheck{
						ID:          "heading-order",
						Impact:      "moderate",
						Description: "Skipped heading level",
						Help:        fmt.Sprintf("Heading levels should not be skipped. Found h%d after h%d", currentLevel, lastLevel),
						HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/heading-order",
						Nodes:       []string{fmt.Sprintf("<%s>%s</%s>", n.Data, headingText, n.Data)},
					})
				} else {
					result.Passes = append(result.Passes, AccessibilityCheck{
						ID:          "heading-order",
						Description: "Heading has valid level",
						Nodes:       []string{getNodeHTML(n)},
					})
				}
			} else if currentLevel != 1 {
				// First heading should be h1
				result.Violations = append(result.Violations, AccessibilityCheck{
					ID:          "heading-order",
					Impact:      "moderate",
					Description: "First heading is not h1",
					Help:        fmt.Sprintf("The first heading on the page should be h1, found h%d", currentLevel),
					HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/heading-order",
					Nodes:       []string{fmt.Sprintf("<%s>%s</%s>", n.Data, headingText, n.Data)},
				})
			} else {
				result.Passes = append(result.Passes, AccessibilityCheck{
					ID:          "heading-order",
					Description: "Heading has valid level",
					Nodes:       []string{getNodeHTML(n)},
				})
			}

			// Add current level to our heading hierarchy
			headingLevels = append(headingLevels, currentLevel)
		}
	}

	// Process children
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkHeadings(c, result)
	}
}

func (s *Scanner) checkForms(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode && (n.Data == "input" || n.Data == "select" || n.Data == "textarea") {
		var hasLabel, hasAriaLabel bool
		var id, name, type_, placeholder string

		for _, attr := range n.Attr {
			switch attr.Key {
			case "id":
				id = attr.Val
			case "name":
				name = attr.Val
			case "type":
				type_ = attr.Val
			case "placeholder":
				placeholder = attr.Val
			case "aria-label", "aria-labelledby":
				hasAriaLabel = true
			}
		}

		if id != "" {
			// Check for associated label
			parent := n.Parent
			for parent != nil {
				for c := parent.FirstChild; c != nil; c = c.NextSibling {
					if c.Type == html.ElementNode && c.Data == "label" {
						for _, attr := range c.Attr {
							if attr.Key == "for" && attr.Val == id {
								hasLabel = true
								break
							}
						}
					}
				}
				parent = parent.Parent
			}
		}

		// Check if the input is hidden or a button type (these don't need visible labels)
		isExempt := type_ == "hidden" || type_ == "button" || type_ == "submit" || type_ == "reset" || type_ == "image"

		if !hasLabel && !hasAriaLabel && !isExempt {
			// Construct helpful description of the element
			elementDesc := n.Data
			if type_ != "" {
				elementDesc += fmt.Sprintf(" type=\"%s\"", type_)
			}
			if id != "" {
				elementDesc += fmt.Sprintf(" id=\"%s\"", id)
			}
			if name != "" {
				elementDesc += fmt.Sprintf(" name=\"%s\"", name)
			}
			if placeholder != "" {
				elementDesc += fmt.Sprintf(" placeholder=\"%s\"", placeholder)
			}

			result.Violations = append(result.Violations, AccessibilityCheck{
				ID:          "label",
				Impact:      "critical",
				Description: "Form element does not have a label",
				Help:        fmt.Sprintf("Form elements must have labels. Element: <%s>", elementDesc),
				HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/label",
				Nodes:       []string{getNodeHTML(n)},
			})
		} else {
			result.Passes = append(result.Passes, AccessibilityCheck{
				ID:          "label",
				Description: "Form element has proper labeling",
				Nodes:       []string{getNodeHTML(n)},
			})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkForms(c, result)
	}
}

func (s *Scanner) checkLinks(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode && n.Data == "a" {
		var hasText bool
		var text string

		// Check for text content
		var f func(*html.Node)
		f = func(n *html.Node) {
			if n.Type == html.TextNode {
				text += strings.TrimSpace(n.Data)
			}
			for c := n.FirstChild; c != nil; c = c.NextSibling {
				f(c)
			}
		}
		f(n)

		hasText = text != ""

		if !hasText {
			result.Violations = append(result.Violations, AccessibilityCheck{
				ID:          "link-name",
				Impact:      "serious",
				Description: "Link does not have descriptive text",
				Help:        "Links must have discernible text",
				HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/link-name",
				Nodes:       []string{getNodeHTML(n)},
			})
		} else {
			result.Passes = append(result.Passes, AccessibilityCheck{
				ID:          "link-name",
				Description: "Link has descriptive text",
				Nodes:       []string{getNodeHTML(n)},
			})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkLinks(c, result)
	}
}

func (s *Scanner) checkARIA(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode {
		var hasInvalidARIA bool
		var ariaAttrs []string

		for _, attr := range n.Attr {
			if strings.HasPrefix(attr.Key, "aria-") {
				ariaAttrs = append(ariaAttrs, attr.Key)
				// Basic validation - could be expanded
				if attr.Val == "" {
					hasInvalidARIA = true
				}
			}
		}

		if hasInvalidARIA {
			result.Violations = append(result.Violations, AccessibilityCheck{
				ID:          "aria-valid",
				Impact:      "serious",
				Description: "ARIA attribute is invalid",
				Help:        "ARIA attributes must be valid",
				HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/aria-valid-attr",
				Nodes:       []string{getNodeHTML(n)},
			})
		} else if len(ariaAttrs) > 0 {
			result.Passes = append(result.Passes, AccessibilityCheck{
				ID:          "aria-valid",
				Description: "ARIA attributes are valid",
				Nodes:       []string{getNodeHTML(n)},
			})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkARIA(c, result)
	}
}

func (s *Scanner) checkLandmarks(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode {
		landmarks := map[string]bool{
			"main":    true,
			"nav":     true,
			"header":  true,
			"footer":  true,
			"article": true,
			"aside":   true,
			"section": true,
		}

		if landmarks[n.Data] {
			result.Passes = append(result.Passes, AccessibilityCheck{
				ID:          "landmark",
				Description: fmt.Sprintf("Page has proper %s landmark", n.Data),
				Nodes:       []string{getNodeHTML(n)},
			})
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkLandmarks(c, result)
	}
}

func getNodeHTML(n *html.Node) string {
	// Get the opening tag with attributes
	var sb strings.Builder
	sb.WriteString("<")
	sb.WriteString(n.Data)
	for _, attr := range n.Attr {
		sb.WriteString(" ")
		sb.WriteString(attr.Key)
		sb.WriteString("=\"")
		sb.WriteString(attr.Val)
		sb.WriteString("\"")
	}
	sb.WriteString(">")

	// Get all child content
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		switch c.Type {
		case html.TextNode:
			sb.WriteString(strings.TrimSpace(c.Data))
		case html.ElementNode:
			var childSb strings.Builder
			html.Render(&childSb, c)
			sb.WriteString(childSb.String())
		}
	}

	// Add closing tag
	sb.WriteString("</")
	sb.WriteString(n.Data)
	sb.WriteString(">")

	return sb.String()
}

// Helper to extract hex or rgb color from inline style
func extractCSSColor(style, prop string) string {
	re := regexp.MustCompile(prop + `:\s*([^;]+);?`)
	matches := re.FindStringSubmatch(style)
	if len(matches) > 1 {
		val := strings.TrimSpace(matches[1])
		if strings.HasPrefix(val, "#") {
			return val
		}
		if strings.HasPrefix(val, "rgb") {
			// Convert rgb/rgba to hex (simple version, assumes rgb)
			val = strings.TrimPrefix(val, "rgb(")
			val = strings.TrimSuffix(val, ")")
			parts := strings.Split(val, ",")
			if len(parts) >= 3 {
				r, _ := strconv.Atoi(strings.TrimSpace(parts[0]))
				g, _ := strconv.Atoi(strings.TrimSpace(parts[1]))
				b, _ := strconv.Atoi(strings.TrimSpace(parts[2]))
				return fmt.Sprintf("#%02x%02x%02x", r, g, b)
			}
		}
	}
	return ""
}

// Color contrast check (Level AA)
func (s *Scanner) checkColorContrast(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode && (n.Data == "p" || n.Data == "span" || n.Data == "div") {
		var fg, bg string
		for _, attr := range n.Attr {
			if attr.Key == "style" {
				style := attr.Val
				if strings.Contains(style, "color:") {
					fg = extractCSSColor(style, "color")
				}
				if strings.Contains(style, "background:") {
					bg = extractCSSColor(style, "background")
				}
				if strings.Contains(style, "background-color:") {
					bg = extractCSSColor(style, "background-color")
				}
			}
		}
		if fg != "" && bg != "" {
			// Use simple luminance/contrast calculation
			contrast := simpleContrastRatio(fg, bg)
			if contrast > 0 {
				if contrast < 4.5 {
					result.Violations = append(result.Violations, AccessibilityCheck{
						ID:          "color-contrast",
						Impact:      "serious",
						Description: "Text has insufficient color contrast",
						Help:        "Foreground and background colors must have sufficient contrast (AA: 4.5:1)",
						HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/color-contrast",
						Nodes:       []string{getNodeHTML(n)},
					})
				} else {
					result.Passes = append(result.Passes, AccessibilityCheck{
						ID:          "color-contrast",
						Description: "Text has sufficient color contrast",
						Nodes:       []string{getNodeHTML(n)},
					})
				}
			}
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkColorContrast(c, result)
	}
}

// Simple contrast ratio calculation (not WCAG-accurate, but illustrative)
func simpleContrastRatio(fg, bg string) float64 {
	parse := func(hex string) (r, g, b float64) {
		hex = strings.TrimPrefix(hex, "#")
		if len(hex) == 6 {
			var ri, gi, bi int
			fmt.Sscanf(hex, "%02x%02x%02x", &ri, &gi, &bi)
			return float64(ri), float64(gi), float64(bi)
		}
		return 0, 0, 0
	}
	fr, fg_, fb := parse(fg)
	br, bg_, bb := parse(bg)
	l1 := 0.2126*fr/255 + 0.7152*fg_/255 + 0.0722*fb/255
	l2 := 0.2126*br/255 + 0.7152*bg_/255 + 0.0722*bb/255
	if l1 > l2 {
		return (l1 + 0.05) / (l2 + 0.05)
	}
	return (l2 + 0.05) / (l1 + 0.05)
}

// Target size check (Level AAA)
func (s *Scanner) checkTargetSize(n *html.Node, result *ScanResult) {
	if n.Type == html.ElementNode && (n.Data == "button" || n.Data == "a") {
		var width, height int
		for _, attr := range n.Attr {
			if attr.Key == "style" {
				style := attr.Val
				if strings.Contains(style, "width:") {
					w := extractCSSDimension(style, "width")
					if w > 0 {
						width = w
					}
				}
				if strings.Contains(style, "height:") {
					h := extractCSSDimension(style, "height")
					if h > 0 {
						height = h
					}
				}
			}
		}
		if width > 0 && height > 0 {
			if width < 24 || height < 24 {
				result.Violations = append(result.Violations, AccessibilityCheck{
					ID:          "target-size",
					Impact:      "minor",
					Description: "Element has insufficient target size",
					Help:        "Clickable targets should be at least 24x24px (AAA)",
					HelpURL:     "https://dequeuniversity.com/rules/axe/4.6/target-size",
					Nodes:       []string{getNodeHTML(n)},
				})
			} else {
				result.Passes = append(result.Passes, AccessibilityCheck{
					ID:          "target-size",
					Description: "Element has sufficient target size",
					Nodes:       []string{getNodeHTML(n)},
				})
			}
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		s.checkTargetSize(c, result)
	}
}

// Helper to extract px dimension from style
func extractCSSDimension(style, prop string) int {
	re := regexp.MustCompile(prop + `:\s*([0-9]+)px`)
	matches := re.FindStringSubmatch(style)
	if len(matches) > 1 {
		val, _ := strconv.Atoi(matches[1])
		return val
	}
	return 0
}
