import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

interface ImageCarouselProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoPlay = true,
  interval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '360px',
        margin: '0 auto',
        mb: 4
      }}
    >
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          aspectRatio: '16/9',
          width: '100%'
        }}
      >
        {/* Imagen actual */}
        <Box
          component="img"
          src={images[currentIndex]}
          alt={`Banner ${currentIndex + 1}`}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }
              }}
              size="small"
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }
              }}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </>
        )}

        {/* Indicadores de puntos */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  '&:hover': {
                    backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.8)'
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ImageCarousel;
