import { useState, useEffect, useCallback } from "react";

interface UseAutoPlayProps {
  totalSlides: number;
  interval?: number;
  initialSlide?: number;
}

export const useAutoPlay = ({ 
  totalSlides, 
  interval = 10000,
  initialSlide = 0 
}: UseAutoPlayProps) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const previousSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, interval, nextSlide]);

  return {
    currentSlide,
    isPlaying,
    nextSlide,
    previousSlide,
    goToSlide,
    togglePlay,
  };
};
