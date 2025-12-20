import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Instagram, Facebook, Clock } from 'lucide-react';

// Import images
import paoImg from '../assets/landing/pao_de_queijo_bg.png';
import caneleImg from '../assets/landing/canele_bg_v3.png';
import cheesecakeImg from '../assets/landing/cheesecake_bg_v2.png';
import cinnamonImg from '../assets/landing/cinnamon_bg_v2.png';

const slides = [
  {
    image: paoImg,
    title: "PÃO DE QUEIJO",
    slogan: "Cheesy & Gluten Free"
  },
  {
    image: caneleImg,
    title: "CANELE",
    slogan: "Crispy & Custardy"
  },
  {
    image: cheesecakeImg,
    title: "CHEESECAKE",
    slogan: "Creamy Perfection"
  },
  {
    image: cinnamonImg,
    title: "CINNAMON ROLL",
    slogan: "Fresh cake every day"
  }
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const instagramUrl = "https://www.instagram.com/thebutter.bake/";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const openInstagram = () => {
    window.open(instagramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#C9A66B]">
      {/* Background Slideshow */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-bottom transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundBlendMode: 'normal', // Removed multiply to show true colors
            backgroundColor: 'rgba(0,0,0,0.1)' 
          }}
        />
      ))}

      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-8 py-6 backdrop-blur-sm bg-gradient-to-t from-transparent to-black/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Navigation */}
          <div className="flex items-center gap-8 text-white">
            <button onClick={openInstagram} className="hover:opacity-80 transition-opacity font-light tracking-wide text-sm uppercase">Menu</button>
            <button onClick={openInstagram} className="hover:opacity-80 transition-opacity font-light tracking-wide text-sm uppercase">Order</button>
          </div>

          {/* Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center w-full max-w-[200px] md:max-w-none">
            <h1 className="text-white text-[5vw] sm:text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase font-serif whitespace-nowrap">The Butter Bake</h1>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-6 text-white">
             <div className="hidden lg:flex items-center gap-4 text-xs font-light tracking-wide opacity-90">
                <div className="flex items-center gap-1">
                   <MapPin size={14} />
                   <span>32A Nguyễn Bá Huân, Thảo Điền</span>
                </div>
            </div>
            <div className="flex gap-4">
                <a href="https://www.instagram.com/thebutter.bake/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Instagram size={18} />
                </a>
                <a href="https://www.facebook.com/ropx2.kitchen" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Facebook size={18} />
                </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Version Toggle Button */}


      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-32 px-4">
        
        {/* Dynamic Title & Slogan */}
        <div className="text-center mb-8 relative w-full max-w-7xl mx-auto">
          {/* Opening Hours - Moved to top */}
          <div className="text-white/90 text-sm md:text-base font-light tracking-[0.2em] uppercase mb-2">
            Open Everyday 10AM - 8PM
          </div>

          <div className="relative py-4 flex flex-col justify-center items-center w-full">
             {/* Main Title */}
             <h2 className="relative z-10 text-white text-[13vw] md:text-[10vw] xl:text-[120px] font-black tracking-wider leading-none transition-all duration-700 transform translate-y-0 font-serif drop-shadow-2xl whitespace-nowrap flex items-baseline gap-2 md:gap-4">
                <span>-</span>
                <span className="relative flex flex-col items-end">
                    {slides[currentSlide].title}
                    {/* Slogan - Below title, Aligned right */}
                    <p className="absolute top-full right-0 mt-2 text-[#8B0000] text-2xl md:text-4xl font-script transform rotate-[-5deg] transition-opacity duration-700 drop-shadow-sm whitespace-nowrap z-20 capitalize">
                        {slides[currentSlide].slogan}
                    </p>
                </span>
                <span>-</span>
            </h2>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row items-center gap-6 mt-16 md:mt-12">
          <button
            onClick={openInstagram}
            className="bg-white text-[#4A3B32] px-8 py-3 rounded-full text-base font-medium hover:bg-opacity-90 transition-all shadow-xl transform hover:scale-105 tracking-wide"
          >
            Order Now
          </button>
          <button
            onClick={openInstagram}
            className="border border-white/80 text-white px-8 py-3 rounded-full text-base font-medium hover:bg-white hover:text-[#4A3B32] transition-all transform hover:scale-105 tracking-wide backdrop-blur-sm"
          >
            View Menu
          </button>
        </div>

        {/* Footer Quote - Bottom Left */}
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 max-w-xs text-left text-white z-20 hidden md:block">
            <h3 className="text-xl md:text-2xl font-bold mb-2 font-serif">100% Handmade & Organic</h3>
            <p className="text-xs md:text-sm font-light leading-relaxed opacity-90">
                Baked by hand with traditional techniques, from clean, natural, and organic sources.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
