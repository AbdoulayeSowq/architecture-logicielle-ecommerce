import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  validate?: (value: string) => string | undefined;
}

const Input: React.FC<InputProps> = ({
  label,
  error: externalError,
  helperText,
  leftIcon,
  rightIcon,
  validate,
  className = '',
  onChange,
  onBlur,
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const error = externalError || internalError;

  const baseStyle = {
    backgroundColor: 'var(--bg-input)',
    border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    padding: leftIcon || rightIcon ? '8px 12px' : '8px 12px',
    fontFamily: 'Inter, sans-serif',
    transition: 'var(--t)',
    color: 'var(--text-primary)',
    width: '100%',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (touched && validate) {
      setInternalError(validate(e.target.value));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onBlur) onBlur(e);
    if (validate) {
      setInternalError(validate(e.target.value));
    }
  };

  return (
    <div className="mb-3" style={{ width: '100%' }}>
      {label && (
        <label htmlFor={props.id} style={{
          fontWeight: 600,
          fontSize: '0.75rem',
          color: error ? 'var(--danger)' : 'var(--text-secondary)',
          marginBottom: '6px',
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          style={{
            ...baseStyle,
            paddingLeft: leftIcon ? '36px' : '12px',
            paddingRight: rightIcon ? '36px' : '12px',
          }}
          className={`form-control ${className}`}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {rightIcon && (
          <span style={{ position: 'absolute', right: '12px', color: 'var(--text-muted)' }} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <div id={`${props.id}-error`} style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }} role="alert">
          {error}
        </div>
      )}
      {helperText && !error && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
