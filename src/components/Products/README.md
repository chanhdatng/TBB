# Products Module

This directory contains components for managing products in the ButterBake Cake Shop Management System.

## Components

### AddProductModal
A modal component for adding new products to the inventory.

**Features:**
- Form fields: name, type/category, price, stock
- Image upload with preview
- Form validation with error messages
- Loading states during upload/save
- Sanitization to prevent XSS attacks

**Props:**
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Called when modal is closed
- `onProductAdded` (function): Called after successful product creation

**Usage:**
```jsx
import AddProductModal from './AddProductModal';

<AddProductModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onProductAdded={() => console.log('Product added!')}
/>
```

## Security Considerations

1. **Authentication**: The upload endpoint requires JWT authentication
2. **Input Validation**: All user inputs are validated and sanitized
3. **File Upload**: Images are validated for type and size (max 5MB)
4. **XSS Prevention**: Product names are sanitized before saving

## API Endpoints

### POST /api/upload-product-image
Uploads product images to the server.

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)

**Request:**
- Multipart form data with 'image' field

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "/uploads/filename.jpg"
}
```

## Data Structure

Products are stored in Firebase Realtime Database at the `cakes` node:

```javascript
{
  "productId": {
    "name": "Product Name",
    "type": "Category",
    "price": 15000,
    "stock": 10,
    "image": "/uploads/product-image.jpg",
    "createdAt": "2023-12-14T10:00:00.000Z"
  }
}
```

## Future Enhancements

- Product editing functionality
- Bulk product operations
- Product categories management
- Advanced search and filtering
- Inventory tracking