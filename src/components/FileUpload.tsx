import { useState, useRef } from 'react';
import { Box, Typography, Button, IconButton, Paper } from '@mui/material';
import { Close, CloudUpload, PictureAsPdf } from '@mui/icons-material';

interface FileUploadProps {
  label: string;
  value: string | File;
  onChange: (file: File | string) => void;
  accept?: string;
  maxSize?: number;
  description?: string;
}

export const FileUpload = ({ 
  label, 
  value, 
  onChange, 
  accept = 'image/*',
  maxSize = 2,
  description 
}: FileUploadProps) => {
  const [preview, setPreview] = useState<string>(typeof value === 'string' ? value : '');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size should be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    const allowedTypes = accept.split(',');
    if (!allowedTypes.some(type => file.type.match(type.trim()))) {
      setError(`Invalid file type. Allowed: ${accept}`);
      return;
    }

    setError('');
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    onChange(file);
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = preview && (preview.startsWith('data:image') || preview.match(/\.(jpg|jpeg|png|gif|svg)$/i));
  return (
    <Paper variant="outlined" className="p-4 bg-white">
      <Typography variant="subtitle2" className="font-semibold !mb-2 !text-gray-800">
        {label}
      </Typography>
      
      {preview ? (
        <Box className="relative inline-block">
          {isImage ? (
            <img 
              src={preview} 
              alt={label} 
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <Box className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
              <PictureAsPdf className="!w-12 !h-12 text-red-500" />
            </Box>
          )}
          <IconButton
            size="small"
            className="!absolute !top-[1px] -right-[27px] bg-white shadow-md"
            onClick={handleRemove}
          >
            <Close className="!w-4 !h-4 text-red-500" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          className="normal-case !mb-2"
        >
          Choose File
        </Button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {description && (
        <Typography variant="caption" className="text-gray-500 block mt-2">
          {description}
        </Typography>
      )}
      
      {error && (
        <Typography variant="caption" className="text-red-500 block mt-1">
          {error}
        </Typography>
      )}
    </Paper>
  );
};
