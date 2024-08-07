'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Stack, Typography, Button, TextField, Modal, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import { useRouter } from 'next/navigation'
import { firestore, storage } from '../firebase'
import { collection, getDocs, query, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import FilterListIcon from '@mui/icons-material/FilterList';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kilograms')
  const [expiryDate, setExpiryDate] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const router = useRouter()

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  const addItem = async () => {
    if (!itemName || !quantity) {
      alert('Name and Quantity are required!')
      return
    }

    const docRef = doc(collection(firestore, 'inventory'), itemName)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists() && docSnap.data().quantity === quantity) {
      alert('This quantity already exists!')
      return
    }

    let url = ''
    if (image) {
      setLoading(true)
      const storageRef = ref(storage, `images/${itemName}`)
      await uploadBytes(storageRef, image)
      url = await getDownloadURL(storageRef)
      setLoading(false)
    } else if (capturedImage) {
      setLoading(true)
      const storageRef = ref(storage, `images/${itemName}`)
      await uploadBytes(storageRef, capturedImage)
      url = await getDownloadURL(storageRef)
      setLoading(false)
    }

    const itemData = {
      quantity: docSnap.exists() ? docSnap.data().quantity + quantity : quantity,
      unit,
      expiryDate,
      category,
      imageUrl: url,
    }

    await setDoc(docRef, itemData)
    await updateInventory()
    handleClose()  // Close the modal after adding the item
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setCapturedImage(null)
  }

  const handleCapture = () => {
    setCameraOpen(true)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        streamRef.current = stream
      })
      .catch(error => {
        console.error('Error accessing camera', error);
      });
  }

  const captureImage = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      setCapturedImage(blob)
      stopCamera()  // Stop camera immediately after capturing
    }, 'image/jpeg')
  }

  const stopCamera = () => {
    const stream = streamRef.current
    if (stream) {
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
    }
    setCameraOpen(false)
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateQuantity = async (name, amount) => {
    const docRef = doc(firestore, 'inventory', name)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const newQuantity = docSnap.data().quantity + amount
      if (newQuantity <= 0) {
        await deleteDoc(docRef)
      } else {
        await updateDoc(docRef, { quantity: newQuantity })
      }
      await updateInventory()
    }
  }

  const deleteItem = async () => {
    if (itemToDelete) {
      const docRef = doc(firestore, 'inventory', itemToDelete)
      await deleteDoc(docRef)
      setDeleteConfirmation(false)
      setItemToDelete(null)
      await updateInventory()
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      sx={{ bgcolor: '#f0f4f8' }}
    >
      <Box
        width="100%"
        bgcolor='#f7f9'
        display="flex"
        justifyContent="center"
        alignItems="center"
        padding={2}
      >
        <Typography variant="h4" color="#00008B" fontWeight="bold" fontFamily="Arial, sans-serif">
          Pantry Tracker
        </Typography>
      </Box>
    
      <Stack direction="column" spacing={2} padding={2}>
        <Box
          padding={0.5}
          border="1px solid #ccc"
          borderRadius="6px"
          bgcolor="#fff"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              onClick={() => setSearchTerm('')}
              sx={{
                color: '#333',
                '&:hover': {
                  bgcolor: '#e4d9e8',
                  transition: 'background-color 0.3s',
                },
              }}
            >
              All
            </Button>
            <Button
              onClick={() => setSearchTerm('Produce')}
              sx={{
                color: '#333',
                '&:hover': {
                  bgcolor: '#e4d9e8',
                  transition: 'background-color 0.3s',
                },
              }}
            >
              Produce
            </Button>
            <Button
              onClick={() => setSearchTerm('Meat & Poultry')}
              sx={{
                color: '#333',
                '&:hover': {
                  bgcolor: '#e4d9e8',
                  transition: 'background-color 0.3s',
                },
              }}
            >
              Meat & Poultry
            </Button>
            <Button
              onClick={() => setSearchTerm('Condiments')}
              sx={{
                color: '#333',
                '&:hover': {
                  bgcolor: '#e4d9e8',
                  transition: 'background-color 0.3s',
                },
              }}
            >
              Condiments
            </Button>
            <Button
              onClick={() => setSearchTerm('Pharma')}
              sx={{
                color: '#333',
                '&:hover': {
                  bgcolor: '#e4d9e8',
                  transition: 'background-color 0.3s',
                },
              }}
            >
              Pharma
            </Button>
            <FilterListIcon />
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} width="100%" padding={2} alignItems="center">
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="contained" onClick={() => setSearchTerm('')}>Search</Button>
      </Stack>
      <Button variant="contained" onClick={handleOpen}>Add New Item</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Add Inventory Item
          </Typography>
          <TextField
            label="Item Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{ borderRadius: '8px' }}
          />
          <TextField
            label="Quantity"
            variant="outlined"
            fullWidth
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            sx={{ borderRadius: '8px' }}
          />
          <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
            <InputLabel>Unit</InputLabel>
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              label="Unit"
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="kilograms">Kilograms</MenuItem>
              <MenuItem value="pounds">Pounds</MenuItem>
              <MenuItem value="liters">Liters</MenuItem>
              <MenuItem value="dozen">Dozen</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Expiry Date"
            variant="outlined"
            fullWidth
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            sx={{ borderRadius: '8px' }}
          />
          <FormControl fullWidth variant="outlined" sx={{ borderRadius: '8px' }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="Produce">Produce</MenuItem>
              <MenuItem value="Condiments">Condiments</MenuItem>
              <MenuItem value="Pharma">Pharma</MenuItem>
              <MenuItem value="Meat & Poultry">Meat & Poultry</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              sx={{
                borderRadius: '8px',
                bgcolor: loading ? '#e0e0e0' : 'initial',
              }}
            >
              {loading ? (
                <span className="loading">Uploading...</span>
              ) : (
                'Upload Image'
              )}
              <input
                type="file"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </Button>
            <Button
              variant="outlined"
              onClick={handleCapture}
              sx={{
                borderRadius: '8px',
              }}
            >
              Capture Image
            </Button>
          </Stack>
          {cameraOpen && (
            <Box>
              <video ref={videoRef} style={{ width: '100%', borderRadius: '8px' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                <Button variant="contained" color="primary" onClick={captureImage}>Capture</Button>
                <Button variant="contained" color="secondary" onClick={stopCamera}>Stop</Button>
              </Stack>
            </Box>
          )}
          <Button
            variant="contained"
            onClick={addItem}
            sx={{
              borderRadius: '8px',
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#115293',
              },
              color: 'white',
            }}
          >
            Add Item
          </Button>
        </Box>
      </Modal>
      <Box width="100%" padding={2} display="flex" flexDirection="column" gap={2}>
        {filteredInventory.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Typography variant="h6">No items found</Typography>
            <Typography>😔</Typography>
          </Box>
        )}
        {filteredInventory.map((item) => (
          <Box
            key={item.name}
            padding={2}
            bgcolor="white"
            boxShadow={2}
            borderRadius={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ '&:hover': { bgcolor: '#e4d9e8', transform: 'scale(1.02)', transition: 'transform 0.3s' } }}
          >
            <Box display="flex" gap={2}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} width="70" height="75" />}
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Typography>{item.quantity} {item.unit}</Typography>
                <Typography>Category: {item.category}</Typography>
              </Box>
            </Box>
            <Typography variant="contained" sx={{color:'red'}}> {item.expiryDate}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="primary" onClick={() => updateQuantity(item.name, 1)}>+</Button>
              <Button variant="contained" color="secondary" onClick={() => updateQuantity(item.name, -1)}>-</Button>
              <Button variant="contained" color="error" onClick={() => { setDeleteConfirmation(true); setItemToDelete(item.name) }}>Delete</Button>
            </Stack>
          </Box>
        ))}
      </Box>
      <Modal
        open={deleteConfirmation}
        onClose={() => setDeleteConfirmation(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Are you sure you want to delete {itemToDelete}?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="error" onClick={deleteItem}>Delete</Button>
            <Button variant="contained" onClick={() => setDeleteConfirmation(false)}>Cancel</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  )
}
