import React, { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'

interface FormData {
  name: string
  email: string
  phone: string
  age: string
  gender: string
  dateOfBirth: string
  dateofApplication: string
  subject: string
  department: string
  message: string
}

interface Submission extends FormData {
  id: number
  documentId?: string
  submittedAt: string
}

// Generate a random 10-digit ID
const generateTenDigitId = () => {
  return Math.floor(1000000000 + Math.random() * 8999999999)
}

const App = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    dateOfBirth: '',
    dateofApplication: '',
    subject: '',
    department: '',
    message: ''
  })

  const [showSubmissions, setShowSubmissions] = useState(false)
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(true)

  // Load submissions from Strapi and localStorage on mount
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log('Fetching from Strapi...')
        // Fetch from Strapi
        const response = await axios.get('http://localhost:1337/api/student-forms')
        console.log('Strapi response:', response.data)
        if (response.data.data && Array.isArray(response.data.data)) {
          // Map Strapi data to frontend format
          const strapiSubmissions: Submission[] = response.data.data.map((item: any) => {
            // Check if item has attributes (Strapi v4 format)
            const attrs = item.attributes || item
            return {
              id: item.id,
              documentId: item.documentId,
              name: attrs.name || '',
              email: attrs.email || '',
              phone: attrs.phone || '',
              age: attrs.age || '',
              gender: attrs.gender || '',
              dateOfBirth: attrs.dateOfBirth || '',
              dateofApplication: attrs.dateofApplication || '',
              subject: attrs.subject || '',
              department: attrs.department || '',
              message: attrs.message || '',
              submittedAt: attrs.createdAt ? new Date(attrs.createdAt).toLocaleString() : new Date().toLocaleString()
            }
          })
          console.log('Mapped submissions:', strapiSubmissions)
          setAllSubmissions(strapiSubmissions)
        }
      } catch (error) {
        console.error('Error fetching submissions from Strapi:', error)
        // Fallback to localStorage if Strapi fails
        const savedSubmissions = localStorage.getItem('submissions')
        console.log('Fallback to localStorage:', savedSubmissions)
        if (savedSubmissions) {
          try {
            const parsed = JSON.parse(savedSubmissions)
            console.log('Parsed localStorage:', parsed)
            setAllSubmissions(parsed)
          } catch (e) {
            console.error('Error parsing localStorage:', e)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  // Update localStorage whenever submissions change (after component mounts)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('submissions', JSON.stringify(allSubmissions))
    }
  }, [allSubmissions, loading])

  // Periodic sync with Strapi for bidirectional updates (new entries AND deletions)
  useEffect(() => {
    // Don't start syncing until initial load is complete
    if (loading) return
    
    const syncInterval = setInterval(async () => {
      try {
        console.log('🔄 Syncing with Strapi...')
        const response = await axios.get('http://localhost:1337/api/student-forms')
        console.log('📊 Strapi response:', response.data)
        if (response.data.data && Array.isArray(response.data.data)) {
          // Map Strapi data to frontend format
          const strapiSubmissions: Submission[] = response.data.data.map((item: any) => {
            // Check if item has attributes (Strapi v4 format)
            const attrs = item.attributes || item
            console.log('Item structure:', { id: item.id, documentId: item.documentId, hasAttributes: !!item.attributes })
            return {
              id: item.id,
              documentId: item.documentId,
              name: attrs.name || '',
              email: attrs.email || '',
              phone: attrs.phone || '',
              age: attrs.age || '',
              gender: attrs.gender || '',
              dateOfBirth: attrs.dateOfBirth || '',
              dateofApplication: attrs.dateofApplication || '',
              subject: attrs.subject || '',
              department: attrs.department || '',
              message: attrs.message || '',
              submittedAt: attrs.createdAt ? new Date(attrs.createdAt).toLocaleString() : new Date().toLocaleString()
            }
          })
          
          console.log('✅ Mapped Strapi submissions:', strapiSubmissions)
          console.log('📱 Current frontend submissions:', allSubmissions)
          
          const strapiIds = new Set(strapiSubmissions.map((sub: Submission) => sub.id))
          const frontendIds = new Set(allSubmissions.map((sub: Submission) => sub.id))
          
          console.log('Strapi IDs:', [...strapiIds])
          console.log('Frontend IDs:', [...frontendIds])
          
          // Check if there are any differences
          const needsSync = strapiIds.size !== frontendIds.size || 
                           ![...strapiIds].every((id: number) => frontendIds.has(id))
          
          console.log('Needs sync?', needsSync)
          
          if (needsSync) {
            console.log('🔄 Syncing frontend with Strapi...')
            // Update frontend with Strapi data (this handles both new entries and deletions)
            setAllSubmissions(strapiSubmissions)
            localStorage.setItem('submissions', JSON.stringify(strapiSubmissions))
            console.log('✅ Sync complete!')
          }
        }
      } catch (error) {
        console.error('❌ Error syncing with Strapi:', error)
      }
    }, 3000) // Sync every 3 seconds
    
    return () => clearInterval(syncInterval)
  }, [loading, allSubmissions])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Submit to Strapi
      const response = await axios.post('http://localhost:1337/api/student-forms', { 
        data: formData 
      })
      
      // Use the Strapi ID that was just created
      const strapiId = response.data.data.id
      const newSubmission: Submission = {
        ...formData,
        id: strapiId,
        submittedAt: new Date().toLocaleString()
      }
      
      setAllSubmissions([newSubmission, ...allSubmissions])
      
      // Save to localStorage as backup
      const updatedSubmissions = [newSubmission, ...allSubmissions]
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions))
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        dateofApplication: '',
        subject: '',
        department: '',
        message: ''
      })
      setShowSubmissions(true)
    } catch (error) {
      console.error('Error submitting form data to backend:', error)
      
      // Fallback: save locally if Strapi fails - use 10-digit ID
      const tenDigitId = generateTenDigitId()
      const newSubmission: Submission = {
        ...formData,
        id: tenDigitId,
        submittedAt: new Date().toLocaleString()
      }
      setAllSubmissions([newSubmission, ...allSubmissions])
      localStorage.setItem('submissions', JSON.stringify([newSubmission, ...allSubmissions]))
      
      alert('Form submitted locally. Backend may be offline.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        dateofApplication: '',
        subject: '',
        department: '',
        message: ''
      })
      setShowSubmissions(true)
    }
  }

  const handleDeleteSubmission = async (id: number) => {
    console.log('🗑️ Delete button clicked for ID:', id)
    
    try {
      // Find the submission to get documentId
      const submissionToDelete = allSubmissions.find(sub => sub.id === id)
      console.log('Submission to delete:', submissionToDelete)
      
      // Try to delete from Strapi if documentId exists
      if (submissionToDelete?.documentId) {
        const deleteUrl = `http://localhost:1337/api/student-forms/${submissionToDelete.documentId}`
        console.log('Delete URL using documentId:', deleteUrl)
        
        try {
          const response = await axios.delete(deleteUrl)
          console.log('✅ Successfully deleted from Strapi:', id)
          console.log('Response status:', response.status)
        } catch (strapiError: any) {
          console.warn('⚠️ Could not delete from Strapi backend:', strapiError.message)
          // Continue to delete from frontend anyway
        }
      } else {
        console.warn('⚠️ No documentId found - skipping backend deletion')
      }
      
      // Delete from local state and localStorage regardless
      console.log('Deleting from local state and localStorage...')
      const updatedSubmissions = allSubmissions.filter(sub => sub.id !== id)
      setAllSubmissions(updatedSubmissions)
      localStorage.setItem('submissions', JSON.stringify(updatedSubmissions))
      
      if (selectedSubmission?.id === id) setSelectedSubmission(null)
      console.log('✅ Deletion complete from frontend!')
    } catch (error: any) {
      console.error('❌ Error during deletion:', error.message)
      
      // Check if it's a 404 - might mean the ID doesn't match
      if (error.response?.status === 404) {
        console.warn('⚠️ 404 - Entry not found in Strapi. Removing from frontend anyway.')
        const updatedSubmissions = allSubmissions.filter(sub => sub.id !== id)
        setAllSubmissions(updatedSubmissions)
        localStorage.setItem('submissions', JSON.stringify(updatedSubmissions))
        if (selectedSubmission?.id === id) setSelectedSubmission(null)
      }
      
      // Don't delete locally if it's a permission error
      if (error.response?.status === 403) {
        alert(`❌ Permission denied: ${error.response?.data?.error?.message || error.message}`)
        return
      }
      
      alert(`❌ Error: ${error.response?.status} ${error.response?.data?.error?.message || error.message}`)
    }
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <div className="top-nav">
        <button className={`nav-btn ${!showSubmissions ? 'active' : ''}`} onClick={() => setShowSubmissions(false)}>
          📝 Form
        </button>
        <button className={`nav-btn ${showSubmissions ? 'active' : ''}`} onClick={() => setShowSubmissions(true)}>
          📋 Submissions ({allSubmissions.length})
        </button>
      </div>

      <div className="content-wrapper">
        {!showSubmissions ? (
          // Form View
          <div className="form-container">
            <h1>Student Registration Form</h1>
            <div className="form-title-subtitle">Fill in all required fields to submit your information</div>

            <form onSubmit={handleSubmit} className="form">
              {/* Personal Information */}
              <div className="form-section-title">📋 Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name <span>*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email <span>*</span></label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone <span>*</span></label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" required />
                </div>
                <div className="form-group">
                  <label htmlFor="age">Age <span>*</span></label>
                  <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age" required />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender <span>*</span></label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth <span>*</span></label>
                  <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                </div>
              </div>

              {/* Academic Information */}
              <div className="form-section-title">🎓 Academic Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="dateofApplication">Date of Application <span>*</span></label>
                  <input type="date" id="dateofApplication" name="dateofApplication" value={formData.dateofApplication} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject <span>*</span></label>
                  <select id="subject" name="subject" value={formData.subject} onChange={handleChange} required>
                    <option value="">Select Subject</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Admission">Admission</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department <span>*</span></label>
                  <select id="department" name="department" value={formData.department} onChange={handleChange} required>
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="form-section-title">Message</div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="message">Message <span>*</span></label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Enter your message" required></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">✓ Submit Form</button>
              </div>
            </form>
          </div>
        ) : selectedSubmission ? (
          // Submission Detail View
          <div className="submission-detail-view">
            <button className="btn-back" onClick={() => setSelectedSubmission(null)}>← Back to List</button>

            <div className="submission-detail-card">
              <div className="detail-header">
                <div className="detail-title-section">
                  <h2>{selectedSubmission.name}</h2>
                  <div className="detail-id">ID: {selectedSubmission.id}</div>
                </div>
                <span className="detail-date">{selectedSubmission.submittedAt}</span>
              </div>

              <div className="detail-content">
                <div className="detail-section">
                  <h3>Personal Information</h3>
                  <div className="detail-grid">
                    {['name', 'email', 'phone', 'age', 'gender'].map((field) => (
                      <div className="detail-row" key={field}>
                        <span className="detail-label">{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
                        <span className="detail-value">{selectedSubmission[field as keyof FormData]}</span>
                      </div>
                    ))}
                  </div>

                  <h3>Academic Information</h3>
                  <div className="detail-grid">
                    {['dateofApplication', 'subject', 'department'].map((field) => (
                      <div className="detail-row" key={field}>
                        <span className="detail-label">{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="detail-value">{selectedSubmission[field as keyof FormData]}</span>
                      </div>
                    ))}
                  </div>

                  <h3>Message</h3>
                  <div className="detail-row">
                    <span className="detail-label">Message:</span>
                    <span className="detail-value">{selectedSubmission.message}</span>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                <button className="btn-delete" onClick={() => handleDeleteSubmission(selectedSubmission.id)}>🗑️ Delete Submission</button>
              </div>
            </div>
          </div>
        ) : (
          // Submissions List View
          <div className="submissions-container">
            <h1>Submitted Forms</h1>

            <div className="search-container">
              <input type="text" placeholder="Search by ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} className="search-input" />
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Loading submissions...</p>
              </div>
            ) : allSubmissions.length === 0 ? (
              <div className="empty-state">
                <p>No submissions yet. Fill out and submit the form to see them here.</p>
              </div>
            ) : (
              <div className="submissions-list">
                {allSubmissions
                  .filter((sub) => sub.id.toString().includes(searchId) || sub.name.toLowerCase().includes(searchId.toLowerCase()))
                  .map((sub) => (
                    <div key={sub.id} className="submission-list-item" onClick={() => setSelectedSubmission(sub)}>
                      <div className="list-item-id-badge">
                        <span className="id-badge">ID: {sub.id}</span>
                      </div>
                      <div className="list-item-header">
                        <h3>{sub.name}</h3>
                        <span className="list-item-date">{sub.submittedAt}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App

