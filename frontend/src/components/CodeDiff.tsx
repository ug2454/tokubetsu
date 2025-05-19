import React from 'react';
import { Box, useTheme } from '@mui/material';
import { diffLines } from 'diff';

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  context?: number;
}

const CodeDiff: React.FC<CodeDiffProps> = ({ oldCode, newCode, context = 2 }) => {
  const theme = useTheme();
  const diff = diffLines(oldCode, newCode);

  // Filter diff parts based on context
  const filteredDiff = diff.reduce<(typeof diff[0] & { lineNumber: number })[]>((acc, part, index) => {
    const hasChangesNearby = diff
      .slice(Math.max(0, index - context), Math.min(diff.length, index + context + 1))
      .some(p => p.added || p.removed);

    if (hasChangesNearby || part.added || part.removed) {
      acc.push({ ...part, lineNumber: acc.length + 1 });
    }
    return acc;
  }, []);

  return (
    <Box
      sx={{
        fontFamily: 'monospace',
        backgroundColor: theme.palette.grey[100],
        borderRadius: 1,
        p: 2,
        overflow: 'auto',
      }}
    >
      {filteredDiff.map((part, index) => (
        <Box
          key={index}
          sx={{
            backgroundColor: part.added
              ? alpha(theme.palette.success.main, 0.1)
              : part.removed
              ? alpha(theme.palette.error.main, 0.1)
              : 'transparent',
            display: 'flex',
            '&:hover': {
              backgroundColor: part.added
                ? alpha(theme.palette.success.main, 0.2)
                : part.removed
                ? alpha(theme.palette.error.main, 0.2)
                : alpha(theme.palette.grey[300], 0.2),
            },
          }}
        >
          <Box
            sx={{
              width: '2rem',
              textAlign: 'right',
              color: theme.palette.text.secondary,
              userSelect: 'none',
              pr: 1,
              borderRight: `1px solid ${theme.palette.divider}`,
              mr: 1,
            }}
          >
            {part.lineNumber}
          </Box>
          <Box
            sx={{
              width: '1rem',
              color: part.added
                ? theme.palette.success.main
                : part.removed
                ? theme.palette.error.main
                : 'transparent',
              fontWeight: 'bold',
              userSelect: 'none',
            }}
          >
            {part.added ? '+' : part.removed ? '-' : ' '}
          </Box>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 0,
              overflow: 'visible',
              flex: 1,
              color: part.added
                ? theme.palette.success.dark
                : part.removed
                ? theme.palette.error.dark
                : theme.palette.text.primary,
            }}
          >
            {part.value.replace(/\n$/, '')}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default CodeDiff; 