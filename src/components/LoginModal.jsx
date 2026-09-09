import React, { useState } from 'react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { loginWithCredentials } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onStartDemo }) {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your XLRI email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const token = await loginWithCredentials(email, password);
      onLoginSuccess(token);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials or proxy connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 24, 29, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        
        {/* Close button if optional */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: 'var(--ink)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 4px 0'
          }}>
            Welcome to XL-Flow
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>
            The zero-friction companion for XLRI students
          </p>
        </div>

        {/* Instant 1-Click Demo Option */}
        <div style={{
          backgroundColor: 'var(--wash-mizu)',
          border: '1px solid rgba(0, 169, 184, 0.3)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mizu)', display: 'block', marginBottom: '8px' }}>
            Instant Evaluation Mode
          </span>
          <button
            onClick={onStartDemo}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--mizu)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 169, 184, 0.25)'
            }}
          >
            <Sparkles size={16} />
            <span>Launch Demo (Term-5 Student)</span>
          </button>
          <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '6px', marginBottom: 0 }}>
            Instant preview with real Term-5 elective timetable & 80% attendance data.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)' }}>OR LOGIN DIRECTLY</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMessage && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--wash-hanko)',
              border: '1px solid rgba(210, 84, 63, 0.3)',
              color: 'var(--hanko)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
              Institute Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--ink-soft)' }} />
              <input
                type="email"
                placeholder="b25349@astra.xlri.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--ink-soft)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="ERP Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 34px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontSize: '13px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '9px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Authenticating with ERP...' : 'Sign In with XLRI ERP'}
          </button>
        </form>

        {/* Privacy Callout */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--ink-soft)',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={14} style={{ color: 'var(--moss)' }} />
          <span>Zero telemetry. Data stays encrypted on your device.</span>
        </div>
      </div>
    </div>
  );
}
