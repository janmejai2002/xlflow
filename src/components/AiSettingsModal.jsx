import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Check, ExternalLink, ShieldCheck, Cpu, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { AI_PROVIDERS, getStoredAiConfig, saveStoredAiConfig, queryAstraAi } from '../services/aiProviderEngine';
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';

export default function AiSettingsModal({ isOpen, onClose }) {
  const [selectedProvider, setSelectedProvider] = useState('astra-instant');
  const [keys, setKeys] = useState({ gemini: '', groq: '', openrouter: '', customEndpoint: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredAiConfig();
      setSelectedProvider(config.provider || 'astra-instant');
      setKeys(config.keys || {});
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    playTactileClick(1100);
    saveStoredAiConfig(selectedProvider, keys);
    toast.success('AI Settings Saved', {
      description: `Active Engine: ${AI_PROVIDERS[Object.keys(AI_PROVIDERS).find(k => AI_PROVIDERS[k].id === selectedProvider)]?.name || selectedProvider}`
    });
    onClose();
  };

  const handleTestConnection = async () => {
    playTactileClick();
    setIsTesting(true);
    setTestResult(null);

    // Temporarily save to test
    saveStoredAiConfig(selectedProvider, keys);

    const startTime = performance.now();
    try {
      const res = await queryAstraAi('Hello Astra, verify connection.', { courses: [], schedule: [] });
      const elapsed = Math.round(performance.now() - startTime);
      setTestResult({
        success: true,
        provider: res.providerName,
        latency: elapsed,
        message: 'Connection verified successfully!'
      });
      playTactileClick(1200);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--wash-mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mizu)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
                AI Engine & Key Vault
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-soft)' }}>
                Choose your free AI provider or run the 100% offline solver
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Privacy & Zero-Cost Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--wash-moss)',
            border: '1px solid rgba(110,140,99,0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--ink)'
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--moss)', flexShrink: 0 }} />
            <span>
              <strong>100% Client-Side Vault:</strong> API keys are stored solely in your browser's <code>localStorage</code> and directly sent to official provider APIs. No middleman servers.
            </span>
          </div>

          {/* Provider Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.values(AI_PROVIDERS).map((prov) => {
              const isSelected = selectedProvider === prov.id;
              return (
                <div
                  key={prov.id}
                  onClick={() => {
                    playTactileClick();
                    setSelectedProvider(prov.id);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--paper)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--mizu)' : 'var(--border)'}`,
                    borderRadius: '14px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="radio"
                        name="ai_provider"
                        checked={isSelected}
                        onChange={() => setSelectedProvider(prov.id)}
                        style={{ accentColor: 'var(--mizu)' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                        {prov.name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: isSelected ? 'var(--wash-mizu)' : 'var(--paper)',
                      color: isSelected ? 'var(--mizu)' : 'var(--ink-soft)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid var(--border)'
                    }}>
                      {prov.badge}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0 24px', fontSize: '11px', color: 'var(--ink-soft)' }}>
                    {prov.description}
                  </p>

                  {/* If Provider requires key, show key input when selected */}
                  {isSelected && prov.requiresKey && (
                    <div style={{ marginTop: '10px', paddingLeft: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                          API Key
                        </label>
                        {prov.keyHelpUrl && (
                          <a
                            href={prov.keyHelpUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11px',
                              color: 'var(--mizu)',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            Get Free Key <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <Key size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--ink-soft)' }} />
                        <input
                          type="password"
                          placeholder={prov.keyPlaceholder}
                          value={
                            prov.id === 'gemini-free' ? keys.gemini || '' :
                            prov.id === 'groq-free' ? keys.groq || '' :
                            prov.id === 'openrouter-free' ? keys.openrouter || '' : ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (prov.id === 'gemini-free') setKeys(k => ({ ...k, gemini: val }));
                            if (prov.id === 'groq-free') setKeys(k => ({ ...k, groq: val }));
                            if (prov.id === 'openrouter-free') setKeys(k => ({ ...k, openrouter: val }));
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 30px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--card)',
                            color: 'var(--ink)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Connection Status Banner */}
          {testResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: testResult.success ? 'var(--wash-moss)' : 'var(--wash-hanko)',
              color: testResult.success ? 'var(--moss)' : 'var(--hanko)',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>
                {testResult.message} {testResult.latency ? `(${testResult.latency}ms • ${testResult.provider})` : ''}
              </span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--paper)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              cursor: isTesting ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={isTesting ? 'animate-spin motion-reduce:animate-none' : ''} />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--ink-soft)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                cursor: 'pointer'
              }}
            >
              <Check size={13} />
              Save & Activate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
