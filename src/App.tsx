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
        if (response.data.data) {
          const strapiSubmissions = response.data.data.map((item: any) => ({
            id: item.id,
            name: item.attributes.name || '',
            email: item.attributes.email || '',
            phone: item.attributes.phone || '',
            age: item.attributes.age || '',
            gender: item.attributes.gender || '',
            dateofApplication: item.attributes.dateofApplication || '',
            subject: item.attributes.subject || '',
            department: item.attributes.department || '',
            message: item.attributes.message || '',
            submittedAt: item.attributes.createdAt ? new Date(item.attributes.createdAt).toLocaleString() : new Date().toLocaleString()
          }))
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Submit to Strapi
      await axios.post('http://localhost:1337/api/student-forms', { 
        data: formData 
      })
      
      // Use a 10-digit ID
      const tenDigitId = generateTenDigitId()
      const newSubmission: Submission = {
        ...formData,
        id: tenDigitId,
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
      
      // Fallback: save locally if Strapi fails
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

  const handleDeleteSubmission = (id: number) => {
    try {
      // Try to delete from Strapi
      axios.delete(`http://localhost:1337/api/student-forms/${id}`)
        .catch(error => console.error('Error deleting from Strapi:', error))
    } catch (error) {
      console.error('Error deleting submission:', error)
    }
    
    // Delete from local state
    const updatedSubmissions = allSubmissions.filter(sub => sub.id !== id)
    setAllSubmissions(updatedSubmissions)
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions))
    
    if (selectedSubmission?.id === id) setSelectedSubmission(null)
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

