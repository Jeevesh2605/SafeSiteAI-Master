import React, { useState, useEffect } from "react";

const ImageSlider = () => {
  const images = ["/images/o1.jpg", "/images/o2.jpg", "/images/o3.jpg"];
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const autoSlide = setInterval(nextSlide, 4000);
    return () => clearInterval(autoSlide);
  }, []);

  return (
    <div className="relative w-140 h-80 overflow-hidden rounded-xl shadow-lg border border-gray-700">
      {/* Slider container */}
      <div
        className="flex transition-transform duration-500 ease-in-out w-full h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Slide ${i + 1}`}
            className="w-full h-full object-cover shrink-0"
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full text-xs hover:bg-black transition"
      >
        &#10094;
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full text-xs hover:bg-black transition"
      >
        &#10095;
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
