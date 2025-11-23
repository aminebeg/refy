import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ReferenceList from './components/ReferenceList'
import ReferenceDetails from './components/ReferenceDetails'
import BatchAddReferencesModal from './components/BatchAddReferencesModal'
import SearchBar from './components/SearchBar'
import SettingsModal from './components/SettingsModal'
import ScholarSearch from './components/ScholarSearch'
import { savePDF, deletePDF } from './utils/pdfStorage'
import { extractPDFMetadata } from './utils/pdfMetadata'

function App() {
  const [references, setReferences] = useState([])
  const [collections, setCollections] = useState([])
  const [folders, setFolders] = useState(['All Papers', 'Recently Added', 'Favorites'])
  const [selectedFolder, setSelectedFolder] = useState('All Papers')
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [selectedReference, setSelectedReference] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState([])
  const [selectedReferenceIds, setSelectedReferenceIds] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load references and collections from localStorage on mount
  useEffect(() => {
    const savedReferences = localStorage.getItem('references')
    const savedCollections = localStorage.getItem('collections')

    if (savedReferences) {
      setReferences(JSON.parse(savedReferences))
    } else {
      // Add some sample references
      const sampleReferences = [
        {
          id: '1',
          title: 'Deep Learning for Natural Language Processing',
          authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
          year: 2023,
          journal: 'Journal of Machine Learning Research',
          type: 'Journal Article',
          abstract: 'This paper presents a comprehensive survey of deep learning techniques applied to natural language processing tasks.',
          tags: ['NLP', 'Deep Learning', 'Survey'],
          pdf: null,
          notes: '',
          favorite: false,
          collectionIds: [],
          dateAdded: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Computer Vision Applications in Medical Imaging',
          authors: ['Brown, C.', 'Davis, M.'],
          year: 2023,
          journal: 'Medical Image Analysis',
          type: 'Journal Article',
          abstract: 'An overview of state-of-the-art computer vision techniques for medical image analysis.',
          tags: ['Computer Vision', 'Medical Imaging', 'AI'],
          pdf: null,
          notes: '',
          favorite: true,
          collectionIds: [],
          dateAdded: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      setReferences(sampleReferences)
      localStorage.setItem('references', JSON.stringify(sampleReferences))
    }

    if (savedCollections) {
      setCollections(JSON.parse(savedCollections))
    }
    setIsLoaded(true)
  }, [])

  // Save references to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('references', JSON.stringify(references))
    }
  }, [references, isLoaded])

  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('collections', JSON.stringify(collections))
    }
  }, [collections, isLoaded])

  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  // Add reference handling for batch PDFs
  const addReference = (reference) => {
    const newReference = {
      ...reference,
      id: Date.now().toString(),
      isFavorite: false,
      dateAdded: new Date().toISOString(),
      collectionIds: reference.collectionIds || []
    }
    setReferences([newReference, ...references])
    // After adding, check if there are more files to process
    if (droppedFiles.length > 0 && currentFileIndex < droppedFiles.length - 1) {
      // Move to next file
      setCurrentFileIndex(currentFileIndex + 1)
    } else {
      // No more files, close modal and reset
      setIsAddModalOpen(false)
      setDroppedFiles([])
      setCurrentFileIndex(0)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Drag over detected')
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Drag leave detected')
    // Only set to false if leaving the main drop zone
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Drop detected!')
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    console.log('Dropped files:', files)
    const pdfFiles = files.filter(file => file.type === 'application/pdf')

    if (pdfFiles.length > 0) {
      console.log(`${pdfFiles.length} PDF file(s) found:`, pdfFiles.map(f => f.name))
      setDroppedFiles(pdfFiles)
      setIsAddModalOpen(true)
    } else if (files.length > 0) {
      console.log('Non-PDF file detected')
      alert('Please drop PDF files only')
    }
  }

  const updateReference = (id, updates) => {
    setReferences(references.map(ref =>
      ref.id === id ? { ...ref, ...updates } : ref
    ))
    if (selectedReference?.id === id) {
      setSelectedReference({ ...selectedReference, ...updates })
    }
  }

  const deleteReference = (id) => {
    setReferences(references.filter(ref => ref.id !== id))
    if (selectedReference?.id === id) {
      setSelectedReference(null)
    }
    deletePDF(id).catch(console.error)
  }

  const toggleReferenceSelection = (id) => {
    setSelectedReferenceIds(prev =>
      prev.includes(id)
        ? prev.filter(refId => refId !== id)
        : [...prev, id]
    )
  }

  const selectAllReferences = () => {
    setSelectedReferenceIds(filteredReferences.map(ref => ref.id))
  }

  const clearSelection = () => {
    setSelectedReferenceIds([])
    setIsSelectionMode(false)
  }

  const deleteSelectedReferences = () => {
    if (selectedReferenceIds.length === 0) return

    const count = selectedReferenceIds.length
    if (window.confirm(`Are you sure you want to delete ${count} reference${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      selectedReferenceIds.forEach(id => deletePDF(id).catch(console.error))
      setReferences(prev => prev.filter(ref => !selectedReferenceIds.includes(ref.id)))
      if (selectedReference && selectedReferenceIds.includes(selectedReference.id)) {
        setSelectedReference(null)
      }
      clearSelection()
    }
  }

  const toggleFavorite = (id) => {
    updateReference(id, {
      favorite: !references.find(ref => ref.id === id).favorite
    })
  }

  // Collection management
  const addCollection = (name) => {
    const newCollection = {
      id: Date.now().toString(),
      name,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`
    }
    setCollections([...collections, newCollection])
  }

  const deleteCollection = (id) => {
    setCollections(collections.filter(c => c.id !== id))
    // Remove collection from all references
    setReferences(references.map(ref => ({
      ...ref,
      collectionIds: ref.collectionIds?.filter(cId => cId !== id) || []
    })))
    if (selectedCollection === id) {
      setSelectedCollection(null)
    }
  }

  const renameCollection = (id, newName) => {
    setCollections(collections.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ))
  }

  // Batch add references
  const addReferencesBatch = (newRefs) => {
    const refsWithMetadata = newRefs.map(ref => ({
      ...ref,
      // Don't generate new IDs - use the ones from the modal that match the PDF storage
      id: ref.id || (Date.now().toString() + Math.random().toString(36).substr(2, 5)),
      isFavorite: ref.isFavorite || false,
      dateAdded: ref.dateAdded || new Date().toISOString()
    }))
    setReferences(prev => [...refsWithMetadata, ...prev])
    // Reset batch state
    setIsAddModalOpen(false)
    setDroppedFiles([])
    setCurrentFileIndex(0)
  }

  // New handler: process dropped/selected PDF files directly
  const handleFilesDrop = async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        // Generate a unique ID for this reference
        const referenceId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

        // Save PDF to IndexedDB
        await savePDF(referenceId, file)

        const metadata = await extractPDFMetadata(file)
        const reference = {
          id: referenceId,
          title: metadata.title || file.name.replace('.pdf', ''),
          authors: metadata.authors?.length > 0 ? metadata.authors : [],
          year: metadata.year || new Date().getFullYear(),
          journal: metadata.journal || '',
          type: metadata.type || 'Journal Article',
          volume: metadata.volume || '',
          issue: metadata.issue || '',
          pages: metadata.pages || '',
          publisher: metadata.publisher || '',
          doi: metadata.doi || '',
          url: metadata.url || '',
          abstract: metadata.abstract || '',
          tags: metadata.journalRanking ? [metadata.journalRanking] : [],
          collectionIds: [],
          pdfId: referenceId, // Store the PDF ID
          hasPDF: true, // Flag to indicate PDF is available
          isFavorite: false,
          dateAdded: new Date().toISOString()
        }
        // Add directly to references list
        setReferences(prev => [reference, ...prev])
      } catch (err) {
        console.error('Failed to process file', file.name, err)
      }
    }
    // Ensure any modal is closed (if it was opened)
    setIsAddModalOpen(false)
    setDroppedFiles([])
    setCurrentFileIndex(0)
  }

  // Pass this handler to Sidebar
  const onFilesDrop = (files) => {
    handleFilesDrop(files)
  }

  // Filter references based on folder, collection, and search
  const filteredReferences = references.filter(ref => {
    // Collection filter
    if (selectedCollection) {
      if (!ref.collectionIds?.includes(selectedCollection)) return false
    }

    // Folder filter
    if (selectedFolder === 'Favorites' && !ref.favorite) return false
    if (selectedFolder === 'Recently Added') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      if (new Date(ref.dateAdded).getTime() < weekAgo) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        ref.title.toLowerCase().includes(query) ||
        ref.authors.some(author => author.toLowerCase().includes(query)) ||
        ref.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (ref.abstract && ref.abstract.toLowerCase().includes(query))
      )
    }

    return true
  })

  return (
    <div className="app">
      <div
        className="app-content"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="drag-overlay">
            <div className="drag-overlay-content">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 8v48M56 32H8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" />
              </svg>
              <h3>Drop PDF here to add reference</h3>
              <p>Metadata will be extracted automatically</p>
            </div>
          </div>
        )}

        <Sidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          collections={collections}
          selectedCollection={selectedCollection}
          onSelectCollection={setSelectedCollection}
          onAddCollection={addCollection}
          onDeleteCollection={deleteCollection}
          onRenameCollection={renameCollection}
          referenceCount={references.length}
          onAddReference={() => setIsAddModalOpen(true)}
          onFilesDrop={handleFilesDrop}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main
          className={`main-content ${selectedFolder === 'Search Scholar' ? 'no-padding' : ''}`}
        >
          {selectedFolder === 'Search Scholar' ? (
            <ScholarSearch onAddReference={addReference} />
          ) : (
            <>
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                resultCount={filteredReferences.length}
              />

              <ReferenceList
                references={filteredReferences}
                selectedReference={selectedReference}
                onSelectReference={setSelectedReference}
                onToggleFavorite={toggleFavorite}
                viewMode={viewMode}
                isSelectionMode={isSelectionMode}
                selectedReferenceIds={selectedReferenceIds}
                onToggleSelection={toggleReferenceSelection}
                onEnterSelectionMode={() => setIsSelectionMode(true)}
                onExitSelectionMode={clearSelection}
                onSelectAll={selectAllReferences}
                onDeleteSelected={deleteSelectedReferences}
              />
            </>
          )}
        </main>

        {selectedReference && (
          <ReferenceDetails
            reference={selectedReference}
            collections={collections}
            onClose={() => setSelectedReference(null)}
            onUpdate={updateReference}
            onDelete={deleteReference}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {isAddModalOpen && (
          <BatchAddReferencesModal
            collections={collections}
            onClose={() => {
              setIsAddModalOpen(false)
              setDroppedFiles([])
              setCurrentFileIndex(0)
            }}
            onAddBatch={addReferencesBatch}
            droppedFiles={droppedFiles}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </div>
    </div>
  )
}

export default App
