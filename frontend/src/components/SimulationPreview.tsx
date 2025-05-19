import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Alert, Link } from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';

interface SimulationPreviewProps {
  url: string;
  onLoad?: (iframe: HTMLIFrameElement) => void;
}

export const SimulationPreview: React.FC<SimulationPreviewProps> = ({ url, onLoad }) => {
  const [iframeError, setIframeError] = useState(false);
  const [errorType, setErrorType] = useState<'security' | 'cors' | 'other'>('other');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const checkIframeLoad = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Try to access the iframe content
        if (iframe.contentWindow) {
          try {
            const iframeDoc = iframe.contentWindow.document;
            
            // Add debug logging
            console.log('Iframe load check:', {
              hasDocument: !!iframeDoc,
              hasBody: !!iframeDoc?.body,
              contentLength: iframeDoc?.body?.innerHTML?.length,
              url: url
            });

            // For local content, we should be able to access the document
            if (url.startsWith(window.location.origin)) {
              if (!iframeDoc || !iframeDoc.body) {
                console.log('Local content iframe is empty');
                setErrorType('other');
                setIframeError(true);
              }
            } else {
              // For external content, check for security restrictions
              try {
                // This will throw if blocked by CORS
                iframe.contentWindow.location.href;
                
                // This will throw if blocked by X-Frame-Options
                if (!iframeDoc || !iframeDoc.body || !iframeDoc.body.innerHTML) {
                  console.log('External content iframe is empty or blocked');
                  setErrorType('security');
                  setIframeError(true);
                }
              } catch (error) {
                console.log('Access error:', error);
                if (error instanceof DOMException && error.name === 'SecurityError') {
                  setErrorType('security');
                } else {
                  setErrorType('cors');
                }
                setIframeError(true);
              }
            }

            // Successfully loaded
            if (!iframeError && onLoad) {
              onLoad(iframe);
            }
          } catch (error) {
            console.log('Content access error:', error);
            setErrorType('security');
            setIframeError(true);
          }
        }
      } catch (error) {
        console.log('General error:', error);
        setErrorType('other');
        setIframeError(true);
      }
    };

    // Check immediately and after a delay
    checkIframeLoad();
    const timeoutId = setTimeout(checkIframeLoad, 2000);

    return () => clearTimeout(timeoutId);
  }, [url, onLoad, iframeError]);

  if (iframeError) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '600px', 
          border: '1px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          gap: 2
        }}
      >
        <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
          {errorType === 'security' && 'This website cannot be previewed due to security restrictions (X-Frame-Options).'}
          {errorType === 'cors' && 'This website cannot be previewed due to cross-origin (CORS) restrictions.'}
          {errorType === 'other' && 'Unable to preview this website due to browser security restrictions.'}
        </Alert>
        
        <Typography variant="body1" align="center" gutterBottom>
          {errorType === 'security' && 
            'The website has security settings that prevent it from being displayed in an iframe. ' +
            'This is a common security measure used by many websites.'
          }
          {errorType === 'cors' && 
            'The website blocks access from different domains. ' +
            'This is a common security measure used by many websites.'
          }
          {errorType === 'other' && 
            'The website cannot be displayed due to browser security restrictions.'
          }
        </Typography>

        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
          You can:
          <br />
          1. Try using our test pages with sample accessibility features
          <br />
          2. Open this website in a new tab to test it directly
          <br />
          3. Use a simpler website that allows iframe embedding
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<OpenInNewIcon />}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Website in New Tab
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <iframe
        ref={iframeRef}
        src={url}
        title="Website Preview"
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        onLoad={(e) => {
          const iframe = e.target as HTMLIFrameElement;
          if (onLoad) {
            onLoad(iframe);
          }
        }}
      />
    </Box>
  );
}; 