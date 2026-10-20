import React from 'react';

interface FormattedContentProps {
  content: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content }) => {
  const parts = content.split(/(#[a-zA-Z0-9_-]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return (
            <span key={i} style={{ color: 'var(--color-primary-text, #0055A4)', fontWeight: 600 }}>
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};
