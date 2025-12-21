'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StatusBadge from '../../components/StatusBadge';
import { getAvailableActions } from '../../../lib/roles';

export default function ITEModule() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [roleOverride, setRoleOverride] = useState(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [itsFile, setItsFile] = useState(null);
  const [itsFields, setItsFields] = useState(null);
  const [itsMetadata, setItsMetadata] = useState({ itsNo: '', eprf: '', forUser: '' });
  const [supplierFiles, setSupplierFiles] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState({});
  const [comments, setComments] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedITEs, setSavedITEs] = useState([]);
  const [currentITEId, setCurrentITEId] = useState(null);
  const [currentITE, setCurrentITE] = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [savedSupplierFiles, setSavedSupplierFiles] = useState([]);
  const [savedItsFilePath, setSavedItsFilePath] = useState(null);
  const [acceptedCells, setAcceptedCells] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  const itsInputRef = useRef(null);
  const supplierInputRef = useRef(null);

  // Fetch ITEs and stats on load
  useEffect(() => {
    fetchITEs();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/ite/stats');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchITEs = async () => {
    try {
      const res = await fetch('/api/ite');
      if (res.ok) {
        const data = await res.json();
        setSavedITEs(data);
      }
    } catch (err) {
      console.error('Failed to fetch ITEs', err);
    }
  };

  // Load an ITE
  const loadITE = (ite) => {
    setItsMetadata(JSON.parse(ite.metadata));
    setItsFields(JSON.parse(ite.itsFields));
    setComparisonData(JSON.parse(ite.comparisonData));
    setRecommendations(JSON.parse(ite.recommendations));
    setSavedSupplierFiles(JSON.parse(ite.supplierFiles || '[]'));
    setSavedItsFilePath(ite.itsFilePath);
    setComments(ite.comments || '');
    setAcceptedCells(JSON.parse(ite.acceptedCells || '{}'));
    setCurrentITEId(ite.id);
    setCurrentITE(ite);
    setStep(4);
    setShowDashboard(false);
  };

  // Save ITE
  const saveITE = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('metadata', JSON.stringify(itsMetadata));
      formData.append('itsFields', JSON.stringify(itsFields));
      formData.append('comparisonData', JSON.stringify(comparisonData));
      formData.append('recommendations', JSON.stringify(recommendations));
      formData.append('acceptedCells', JSON.stringify(acceptedCells));
      formData.append('comments', comments);

      if (itsFile) {
        formData.append('itsFile', itsFile);
      }

      supplierFiles.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`supplierFile${index}`, file);
        }
      });

      let url = '/api/ite';
      let method = 'POST';

      if (currentITEId) {
        url = `/api/ite/${currentITEId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to save ITE');

      const savedData = await res.json();
      setCurrentITEId(savedData.id);

      if (!currentITEId) {
        setItsMetadata(prev => ({ ...prev, itsNo: savedData.iteNumber }));
        alert(`Saved successfully as ${savedData.iteNumber}`);
      } else {
        alert('Changes saved successfully');
      }

      fetchITEs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cell edit
  const handleCellEdit = (rowIdx, supplierIdx, value) => {
    const newData = { ...comparisonData };
    newData.comparison[rowIdx].suppliers[supplierIdx].value = value;
    setComparisonData(newData);
  };

  // Step 1: Handle ITS file upload
  const handleItsUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setItsFile(file);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-its', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract ITS specifications');
      }

      const data = await response.json();
      setItsFields(data.fields);
      setItsMetadata(data.metadata || { itsNo: '', eprf: '', forUser: '' });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle field updates
  const handleFieldChange = (index, field, value) => {
    const updated = [...itsFields];
    updated[index] = { ...updated[index], [field]: value };
    setItsFields(updated);
  };

  const handleMetadataChange = (field, value) => {
    setItsMetadata({ ...itsMetadata, [field]: value });
  };

  const addField = () => {
    setItsFields([...itsFields, { feature: '', specification: '' }]);
  };

  const removeField = (index) => {
    setItsFields(itsFields.filter((_, i) => i !== index));
  };

  const confirmItsFields = () => {
    setStep(3);
  };

  // Step 3: Handle supplier file uploads
  const handleSupplierUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.slice(0, 4 - supplierFiles.length);
    setSupplierFiles([...supplierFiles, ...newFiles]);
  };

  const removeSupplierFile = (index) => {
    setSupplierFiles(supplierFiles.filter((_, i) => i !== index));
  };

  // Step 4: Generate comparison
  const generateComparison = async () => {
    if (supplierFiles.length === 0) {
      setError('Please upload at least one supplier quotation');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('itsFields', JSON.stringify(itsFields));
      supplierFiles.forEach((file, index) => {
        formData.append(`supplier${index}`, file);
      });

      const response = await fetch('/api/extract-quotes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract supplier quotations');
      }

      const data = await response.json();
      setComparisonData(data);

      const recs = {};
      data.suppliers.forEach((_, idx) => {
        recs[idx] = data.suppliers[idx].autoRecommend ? true : null;
      });
      setRecommendations(recs);

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle recommendation
  const toggleRecommendation = (supplierIndex) => {
    setRecommendations({
      ...recommendations,
      [supplierIndex]: recommendations[supplierIndex] ? null : true,
    });
  };

  // Get cell status class
  const getCellClass = (status, rowIdx, cellIdx) => {
    const cellKey = `${rowIdx}-${cellIdx}`;
    if (acceptedCells[cellKey]) {
      return 'cell-accepted';
    }
    switch (status) {
      case 'compliant': return 'cell-compliant';
      case 'warning': return 'cell-warning';
      case 'error': return 'cell-error';
      case 'na': return 'cell-na';
      default: return '';
    }
  };

  // Handle right-click on cells
  const handleCellRightClick = (e, rowIdx, cellIdx, status) => {
    const cellKey = `${rowIdx}-${cellIdx}`;
    if (status === 'error' && !acceptedCells[cellKey]) {
      e.preventDefault();
      setContextMenu({
        x: e.pageX,
        y: e.pageY,
        rowIdx,
        cellIdx,
      });
    }
  };

  // Mark cell as accepted
  const markCellAsAccepted = () => {
    if (contextMenu) {
      const cellKey = `${contextMenu.rowIdx}-${contextMenu.cellIdx}`;
      setAcceptedCells({
        ...acceptedCells,
        [cellKey]: {
          acceptedBy: session?.user?.email || 'Unknown',
          acceptedAt: new Date().toISOString(),
          acceptedByName: session?.user?.name || session?.user?.email || 'Unknown',
        },
      });
      setContextMenu(null);
    }
  };

  // View PDF
  const viewPdf = (index) => {
    let url = null;
    if (supplierFiles[index] && supplierFiles[index] instanceof File) {
      url = URL.createObjectURL(supplierFiles[index]);
    } else if (savedSupplierFiles[index]) {
      url = savedSupplierFiles[index];
    }

    if (url) {
      window.open(url, '_blank', 'width=1000,height=800');
    } else {
      alert('No PDF available for this supplier');
    }
  };

  const viewItsPdf = () => {
    let url = null;
    if (itsFile) {
      url = URL.createObjectURL(itsFile);
    } else if (savedItsFilePath) {
      url = savedItsFilePath;
    }

    if (url) {
      window.open(url, '_blank', 'width=1000,height=800');
    } else {
      alert('No ITS PDF available');
    }
  };

  // Delete ITE
  const deleteITE = async (e, iteId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this ITE?')) return;

    try {
      const res = await fetch(`/api/ite/${iteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchITEs();
        if (currentITEId === iteId) {
          resetWorkflow();
        }
      } else {
        alert('Failed to delete ITE');
      }
    } catch (err) {
      console.error('Error deleting ITE:', err);
      alert('Failed to delete ITE');
    }
  };

  // Handle workflow actions
  const handleWorkflowAction = async (action, comment = '') => {
    if (!currentITEId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/ite/${currentITEId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment })
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentITE(data.ite);
        await fetchITEs();
        alert(data.message || 'Workflow action completed successfully');
      } else {
        alert(data.error || 'Failed to perform workflow action');
      }
    } catch (err) {
      console.error('Error performing workflow action:', err);
      alert('Failed to perform workflow action');
    } finally {
      setLoading(false);
    }
  };

  // Export ITE as PDF
  const exportPDF = async (e, iteId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ite/${iteId}/export-pdf`);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const contentDisposition = res.headers.get('Content-Disposition');
        let filename = `ITE-${iteId}.pdf`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export PDF');
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF');
    }
  };

  // Reset workflow
  const resetWorkflow = () => {
    setStep(1);
    setItsFile(null);
    setItsFields(null);
    setItsMetadata({ itsNo: '', eprf: '', forUser: '' });
    setSupplierFiles([]);
    setComparisonData(null);
    setRecommendations({});
    setComments('');
    setError(null);
    setCurrentITEId(null);
    setViewingPdf(null);
    setSavedSupplierFiles([]);
    setSavedItsFilePath(null);
    setShowDashboard(true);
  };

  // Get effective user with role override
  const getEffectiveUser = () => {
    if (!session?.user) return null;

    if (session.user.role === 'ADMIN' && roleOverride) {
      return {
        ...session.user,
        role: roleOverride,
        _originalRole: 'ADMIN',
        _isTesting: true
      };
    }

    return session.user;
  };

  const effectiveUser = getEffectiveUser();

  // Handle role switch
  const handleRoleSwitch = (newRole) => {
    if (session?.user?.role === 'ADMIN') {
      setRoleOverride(newRole === 'ADMIN' ? null : newRole);
      setShowRoleSwitcher(false);
      fetchITEs();
      fetchDashboardStats();
    }
  };

  return (
    <div className="ite-module-container">
      {/* Role switcher for Admin */}
      {session?.user?.role === 'ADMIN' && effectiveUser && (
        <div className="ite-header-controls">
          <div className="role-switcher-container">
            <button
              className="role-switcher-btn"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            >
              {effectiveUser._isTesting && '🧪 '}
              Testing as: {effectiveUser.role === 'ITE_VIEWER' ? 'VIEWER' :
                         effectiveUser.role === 'ITE_CREATOR' ? 'CREATOR' :
                         effectiveUser.role === 'ITE_REVIEWER' ? 'REVIEWER' :
                         effectiveUser.role === 'ITE_APPROVER' ? 'APPROVER' :
                         effectiveUser.role} ▼
            </button>

            {showRoleSwitcher && (
              <div className="role-switcher-dropdown">
                <div className="dropdown-header">🧪 Test As Role:</div>
                {['ADMIN', 'ITE_CREATOR', 'ITE_REVIEWER', 'ITE_APPROVER', 'ITE_VIEWER'].map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`role-option ${effectiveUser.role === role ? 'active' : ''}`}
                  >
                    {role === 'ITE_VIEWER' ? 'Viewer' :
                     role === 'ITE_CREATOR' ? 'Creator' :
                     role === 'ITE_REVIEWER' ? 'Reviewer' :
                     role === 'ITE_APPROVER' ? 'Approver' :
                     'Admin (Real Role)'}
                    {effectiveUser.role === role && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {showDashboard ? (
        <div className="card">
          <div className="dashboard-header">
            <div>
              <h2 className="card-title">📂 Document Summary</h2>
              <div className="dashboard-stats">
                <div className="stat-item">
                  <span className="stat-label">Total ITEs</span>
                  <span className="stat-value">{dashboardStats?.total || savedITEs.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">In Review</span>
                  <span className="stat-value">{dashboardStats?.inReview || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">In Approval</span>
                  <span className="stat-value">{dashboardStats?.inApproval || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Approved</span>
                  <span className="stat-value">{dashboardStats?.approved || 0}</span>
                </div>
                {dashboardStats?.roleSpecific?.myITEs !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">My ITEs</span>
                    <span className="stat-value">{dashboardStats.roleSpecific.myITEs}</span>
                  </div>
                )}
                {dashboardStats?.roleSpecific?.pendingMyReview !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Pending My Review</span>
                    <span className="stat-value">{dashboardStats.roleSpecific.pendingMyReview}</span>
                  </div>
                )}
                {dashboardStats?.roleSpecific?.pendingMyApproval !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Pending My Approval</span>
                    <span className="stat-value">{dashboardStats.roleSpecific.pendingMyApproval}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetWorkflow();
                setShowDashboard(false);
              }}
              disabled={effectiveUser?.role === 'ITE_VIEWER' || effectiveUser?.role === 'ITE_APPROVER'}
              title={
                effectiveUser?.role === 'ITE_VIEWER' ? 'Viewers cannot create ITEs' :
                effectiveUser?.role === 'ITE_APPROVER' ? 'Approvers cannot create ITEs' :
                'Create new ITE'
              }
            >
              ✨ New ITE
            </button>
          </div>

          {savedITEs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No ITEs created yet</div>
              <div className="empty-state-hint">Create your first Item Technical Evaluation to get started</div>
            </div>
          ) : (
            <div className="ite-table-container">
              <table className="ite-list-table">
                <thead>
                  <tr>
                    <th>ITE Number</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>For</th>
                    <th>EPRF</th>
                    <th>Creator</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedITEs.map((ite) => {
                    const metadata = JSON.parse(ite.metadata || '{}');
                    const availableActions = effectiveUser ? getAvailableActions(effectiveUser, ite) : ['view'];

                    return (
                    <tr key={ite.id} className="ite-row">
                      <td
                        className="ite-number"
                        onClick={() => loadITE(ite)}
                        title="Click to open"
                      >
                        {ite.iteNumber}
                      </td>
                      <td>
                        <StatusBadge status={ite.status} />
                      </td>
                      <td>{new Date(ite.createdAt).toLocaleDateString()}</td>
                      <td>{metadata.forUser || '-'}</td>
                      <td>{metadata.eprf || '-'}</td>
                      <td>{ite.creator?.name || ite.creator?.email || '-'}</td>
                      <td className="ite-actions">
                        {availableActions.includes('view') && (
                          <button
                            className="action-btn btn-view"
                            onClick={() => loadITE(ite)}
                            title="View ITE"
                          >
                            👁️
                          </button>
                        )}
                        {availableActions.includes('edit') && (
                          <button
                            className="action-btn btn-edit"
                            onClick={() => {
                              loadITE(ite);
                              setIsEditMode(true);
                            }}
                            title="Modify ITE"
                          >
                            ✏️
                          </button>
                        )}
                        {availableActions.includes('delete') && (
                          <button
                            className="action-btn btn-delete"
                            onClick={(e) => deleteITE(e, ite.id)}
                            title="Delete ITE"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Steps indicator */}
          <div className="steps">
            <button
              className="step-dashboard-btn"
              onClick={() => {
                resetWorkflow();
                setShowDashboard(true);
              }}
              title="Back to Dashboard"
            >
              🏠 Dashboard
            </button>
            <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              <span className="step-number">{step > 1 ? '✓' : '1'}</span>
              Upload ITS
            </div>
            <div className={`step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <span className="step-number">{step > 2 ? '✓' : '2'}</span>
              Confirm Specs
            </div>
            <div className={`step ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
              <span className="step-number">{step > 3 ? '✓' : '3'}</span>
              Upload Quotes
            </div>
            <div className={`step ${step === 4 ? 'active' : ''}`}>
              <span className="step-number">4</span>
              Review ITE
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Upload ITS */}
          {step === 1 && (
            <div className="card">
              <h2 className="card-title">📄 Upload Item Technical Specification</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Upload the ITS document in PDF format. The system will extract the specifications automatically.
              </p>

              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p className="loading-text">Extracting ITS specifications...</p>
                </div>
              ) : (
                <div
                  className="upload-zone"
                  onClick={() => itsInputRef.current?.click()}
                >
                  <input
                    ref={itsInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleItsUpload}
                  />
                  <div className="upload-icon">📑</div>
                  <p className="upload-text">Click to upload ITS document</p>
                  <p className="upload-hint">PDF format only</p>
                </div>
              )}

              {itsFile && !loading && (
                <div className="file-list">
                  <div className="file-item">
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{itsFile.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Confirm ITS fields */}
          {step === 2 && itsFields && (
            <div className="card">
              <h2 className="card-title">✏️ Confirm ITS Specifications</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Review and modify the extracted specifications if needed.
              </p>

              <div className="its-info">
                <div className="its-info-item">
                  <span className="its-info-label">ITS Number</span>
                  <input
                    className="form-input"
                    value={itsMetadata.itsNo}
                    onChange={(e) => handleMetadataChange('itsNo', e.target.value)}
                    placeholder="e.g., ITS/2023/0154"
                  />
                </div>
                <div className="its-info-item">
                  <span className="its-info-label">EPRF</span>
                  <input
                    className="form-input"
                    value={itsMetadata.eprf}
                    onChange={(e) => handleMetadataChange('eprf', e.target.value)}
                    placeholder="e.g., 2023/191"
                  />
                </div>
                <div className="its-info-item">
                  <span className="its-info-label">For</span>
                  <input
                    className="form-input"
                    value={itsMetadata.forUser}
                    onChange={(e) => handleMetadataChange('forUser', e.target.value)}
                    placeholder="e.g., Yoosuf Sameeh"
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Specifications to Compare</h3>

              {itsFields.map((field, index) => (
                <div key={index} className="form-grid" style={{ marginBottom: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Feature</label>
                    <input
                      className="form-input"
                      value={field.feature}
                      onChange={(e) => handleFieldChange(index, 'feature', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Specification</label>
                    <input
                      className="form-input"
                      value={field.specification}
                      onChange={(e) => handleFieldChange(index, 'specification', e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => removeField(index)}
                    style={{ height: '42px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={addField}>
                  + Add Field
                </button>
                <button className="btn btn-primary" onClick={confirmItsFields}>
                  Confirm & Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload supplier quotations */}
          {step === 3 && (
            <div className="card">
              <h2 className="card-title">📤 Upload Supplier Quotations</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Upload up to 4 supplier quotation PDFs. The system will extract and compare them against the ITS.
              </p>

              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p className="loading-text">Extracting and comparing quotations...</p>
                </div>
              ) : (
                <>
                  {supplierFiles.length < 4 && (
                    <div
                      className="upload-zone"
                      onClick={() => supplierInputRef.current?.click()}
                    >
                      <input
                        ref={supplierInputRef}
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleSupplierUpload}
                      />
                      <div className="upload-icon">📁</div>
                      <p className="upload-text">Click to upload supplier quotations</p>
                      <p className="upload-hint">PDF format • Up to {4 - supplierFiles.length} more file(s)</p>
                    </div>
                  )}

                  {supplierFiles.length > 0 && (
                    <div className="file-list">
                      {supplierFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <div className="file-info">
                            <span className="file-icon">📄</span>
                            <span className="file-name">Supplier {String.fromCharCode(65 + index)}: {file.name}</span>
                          </div>
                          <button className="file-remove" onClick={() => removeSupplierFile(index)}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="btn-group">
                    <button className="btn btn-secondary" onClick={() => setStep(2)}>
                      ← Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={generateComparison}
                      disabled={supplierFiles.length === 0}
                    >
                      Generate Comparison →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Review ITE - Continue in next part due to length */}
          {step === 4 && comparisonData && (
            <div className="card">
              <div className="card-header-actions">
                <h2 className="card-title">📊 Item Technical Evaluation</h2>
              </div>

              {/* Workflow Status and Actions */}
              {currentITE && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 600, color: '#495057' }}>Status:</span>
                    <StatusBadge status={currentITE.status} />
                    {currentITE.status === 'APPROVED' && currentITE.approvedAt && (
                      <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                        Approved on {new Date(currentITE.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Creator: Submit for Review */}
                    {effectiveUser?.role === 'ITE_CREATOR' &&
                     currentITE.creatorId === effectiveUser.id &&
                     (currentITE.status === 'DRAFT' || currentITE.status === 'REJECTED') && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleWorkflowAction('submit')}
                        disabled={loading}
                      >
                        📤 Submit for Review
                      </button>
                    )}

                    {/* Creator: Recall from Review */}
                    {effectiveUser?.role === 'ITE_CREATOR' &&
                     currentITE.creatorId === effectiveUser.id &&
                     (currentITE.status === 'PENDING_REVIEW' || currentITE.status === 'IN_REVIEW') && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleWorkflowAction('recall')}
                        disabled={loading}
                      >
                        ↩️ Recall
                      </button>
                    )}

                    {/* Reviewer: Mark as Reviewed */}
                    {effectiveUser?.role === 'ITE_REVIEWER' &&
                     (currentITE.status === 'PENDING_REVIEW' || currentITE.status === 'IN_REVIEW') && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleWorkflowAction('mark_reviewed')}
                        disabled={loading}
                      >
                        ✅ Complete Review
                      </button>
                    )}

                    {/* Approver: Approve or Reject */}
                    {effectiveUser?.role === 'ITE_APPROVER' &&
                     currentITE.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleWorkflowAction('approve')}
                          disabled={loading}
                          style={{ backgroundColor: '#198754' }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            const reason = prompt('Please provide a reason for rejection:');
                            if (reason) handleWorkflowAction('reject', reason);
                          }}
                          disabled={loading}
                          style={{ backgroundColor: '#dc3545', color: 'white' }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}

                    {/* Admin has all actions */}
                    {effectiveUser?.role === 'ADMIN' && (
                      <>
                        {currentITE.status === 'DRAFT' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleWorkflowAction('submit')}
                            disabled={loading}
                          >
                            📤 Submit for Review
                          </button>
                        )}
                        {(currentITE.status === 'PENDING_REVIEW' || currentITE.status === 'IN_REVIEW') && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleWorkflowAction('recall')}
                              disabled={loading}
                            >
                              ↩️ Recall
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleWorkflowAction('mark_reviewed')}
                              disabled={loading}
                            >
                              ✅ Complete Review
                            </button>
                          </>
                        )}
                        {currentITE.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleWorkflowAction('approve')}
                              disabled={loading}
                              style={{ backgroundColor: '#198754' }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                const reason = prompt('Please provide a reason for rejection:');
                                if (reason) handleWorkflowAction('reject', reason);
                              }}
                              disabled={loading}
                              style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="its-info" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className="its-info-item">
                    <span className="its-info-label">ITS Number</span>
                    <span className="its-info-value">{itsMetadata.itsNo || '-'}</span>
                  </div>
                  <div className="its-info-item">
                    <span className="its-info-label">EPRF</span>
                    <span className="its-info-value">{itsMetadata.eprf || '-'}</span>
                  </div>
                  <div className="its-info-item">
                    <span className="its-info-label">For</span>
                    <span className="its-info-value">{itsMetadata.forUser || '-'}</span>
                  </div>
                  <button
                    className="btn-xs"
                    onClick={viewItsPdf}
                    title="View Original ITS PDF"
                    style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    📄 View ITS PDF
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {currentITEId && (
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => exportPDF(e, currentITEId)}
                      title="Export as PDF"
                    >
                      📄 Export PDF
                    </button>
                  )}
                  {effectiveUser?.role !== 'ITE_VIEWER' &&
                   (currentITE?.status !== 'APPROVED' || effectiveUser?.role === 'ADMIN') && (
                    <button
                      className={`btn ${isEditMode ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setIsEditMode(!isEditMode)}
                      title={currentITE?.status === 'APPROVED' ? 'Approved ITEs cannot be edited' : ''}
                    >
                      {isEditMode ? '💾 Save Changes' : '✏️ Enable Edit Mode'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table id="comparison-table" className="comparison-table">
                  <thead>
                    <tr>
                      <th>ITS Requirement</th>
                      {comparisonData.suppliers.map((_, idx) => (
                        <th key={idx}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <span>Supplier {String.fromCharCode(65 + idx)}</span>
                            <button
                              className="btn-xs"
                              onClick={() => viewPdf(idx)}
                              title="View Original PDF"
                            >
                              👁️ View PDF
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.comparison.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td>{row.feature}: {row.itsSpec}</td>
                        {row.suppliers.map((cell, cellIdx) => {
                          const cellKey = `${rowIdx}-${cellIdx}`;
                          const isAccepted = acceptedCells[cellKey];
                          return (
                            <td
                              key={cellIdx}
                              className={getCellClass(cell.status, rowIdx, cellIdx)}
                              onContextMenu={(e) => handleCellRightClick(e, rowIdx, cellIdx, cell.status)}
                              style={{ position: 'relative' }}
                            >
                              {isEditMode ? (
                                <textarea
                                  className="cell-input"
                                  value={cell.value || ''}
                                  onChange={(e) => handleCellEdit(rowIdx, cellIdx, e.target.value)}
                                  rows={2}
                                />
                              ) : (
                                <>
                                  {cell.value || 'N/A'}
                                  {isAccepted && (
                                    <div className="accepted-indicator" title={`Accepted by ${isAccepted.acceptedByName} on ${new Date(isAccepted.acceptedAt).toLocaleString()}`}>
                                      ✓ Accepted
                                    </div>
                                  )}
                                </>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Delivery row */}
                    <tr>
                      <td>Delivery</td>
                      {comparisonData.suppliers.map((s, idx) => (
                        <td key={idx}>{s.delivery || '-'}</td>
                      ))}
                    </tr>
                    {/* Price row */}
                    <tr>
                      <td>Price</td>
                      {comparisonData.suppliers.map((s, idx) => (
                        <td key={idx}>{s.price || '-'}</td>
                      ))}
                    </tr>
                    {/* Recommendation row */}
                    <tr className="recommendation-row">
                      <td>ICTD Recommended</td>
                      {comparisonData.suppliers.map((s, idx) => (
                        <td
                          key={idx}
                          style={{
                            cursor: (effectiveUser?.role !== 'ITE_VIEWER' &&
                                    (currentITE?.status !== 'APPROVED' || effectiveUser?.role === 'ADMIN'))
                                    ? 'pointer' : 'default',
                            textAlign: 'center'
                          }}
                          onClick={(effectiveUser?.role !== 'ITE_VIEWER' &&
                                   (currentITE?.status !== 'APPROVED' || effectiveUser?.role === 'ADMIN'))
                                   ? () => toggleRecommendation(idx) : undefined}
                          title={(effectiveUser?.role !== 'ITE_VIEWER' &&
                                 (currentITE?.status !== 'APPROVED' || effectiveUser?.role === 'ADMIN'))
                                 ? "Click to toggle recommendation" : "View only"}
                        >
                          {recommendations[idx] ? (
                            <span className="checkmark">✔</span>
                          ) : s.autoRecommend === false ? (
                            <span className="pending">Review needed</span>
                          ) : (
                            <span style={{ color: '#a0aec0' }}>-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>
                *Fields highlighted in <span style={{ color: 'var(--color-error)' }}>RED</span> do not meet the ITS specification.
                Fields in <span style={{ color: '#92400e' }}>YELLOW</span> need manual verification.
                Click on recommendation cells to toggle approval.
              </p>

              <div className="comment-section">
                <h3>Recommendation Reason / Comments</h3>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    (effectiveUser?.role === 'ITE_VIEWER' ||
                     (currentITE?.status === 'APPROVED' && effectiveUser?.role !== 'ADMIN'))
                    ? "View only - cannot edit comments"
                    : "Enter justification for recommendations or any additional comments..."
                  }
                  disabled={
                    effectiveUser?.role === 'ITE_VIEWER' ||
                    (currentITE?.status === 'APPROVED' && effectiveUser?.role !== 'ADMIN')
                  }
                  style={{
                    backgroundColor: (effectiveUser?.role === 'ITE_VIEWER' ||
                                     (currentITE?.status === 'APPROVED' && effectiveUser?.role !== 'ADMIN'))
                                     ? '#f5f5f5' : 'white',
                    cursor: (effectiveUser?.role === 'ITE_VIEWER' ||
                            (currentITE?.status === 'APPROVED' && effectiveUser?.role !== 'ADMIN'))
                            ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              <div className="footer-actions">
                <button className="btn btn-secondary" onClick={() => setStep(3)}>
                  ← Back
                </button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={resetWorkflow}>
                    Start Over
                  </button>
                  <button className="btn btn-primary" onClick={saveITE} disabled={loading}>
                    {loading ? 'Saving...' : '💾 Save ITE'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Context Menu for marking cells as acceptable */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'absolute',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={markCellAsAccepted}
          >
            ✓ Mark as Acceptable
          </button>
        </div>
      )}
    </div>
  );
}
