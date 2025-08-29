import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';

interface Option {
  id: string | number;
  name: string;
  value: string; // s3Url
}

interface CarouselWithSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
}

export const CarouselWithSelect: React.FC<CarouselWithSelectProps> = ({ options, value, onChange }) => {
  const handleSelect = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  // Выбранные картинки для отображения сверху
  const selectedOptions = options.filter(opt => value.includes(opt.value));

  return (
    <div className="w-full">
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedOptions.map(opt => (
            <div key={opt.value} className="relative flex flex-col items-center border-2 border-primary bg-primary/10 rounded-xl p-1 shadow-lg transition-all">
              <img
                src={opt.value}
                alt={opt.name}
                className="w-14 h-14 object-contain select-none pointer-events-none drop-shadow-md"
                draggable={false}
              />
              <button
                className="absolute -top-2 -right-2 bg-white border border-primary rounded-full p-0.5 shadow hover:bg-primary hover:text-white transition-colors"
                onClick={() => handleSelect(opt.value)}
                tabIndex={-1}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={24}
          slidesPerView={window.innerWidth < 640 ? 1.2 : 3}
          className="group"
        >
          {options.map(option => (
            <SwiperSlide key={option.id}>
              <div
                className={`relative flex flex-col items-center border rounded-xl box-border pt-3 pb-1 px-3 m-2 cursor-pointer transition-all duration-300 group ${value.includes(option.value) ? 'ring-4 ring-primary bg-primary/10' : 'hover:ring-2 hover:ring-muted'} animate-fade-in`}
                onClick={() => handleSelect(option.value)}
                style={{ minHeight: 160, minWidth: 150, overflow: 'visible' }}
              >
                <img
                  src={option.value}
                  alt={option.name}
                  className="w-24 h-24 object-contain mb-2 select-none pointer-events-none drop-shadow-lg"
                  style={{ maxWidth: '100%', maxHeight: '96px' }}
                  draggable={false}
                />
                <span className="text-sm text-center truncate w-full font-medium text-foreground/90 mt-1">
                  {option.name}
                </span>
                {value.includes(option.value) && (
                  <span className="absolute top-2 left-2 bg-primary text-white rounded-full p-1 shadow-lg animate-fade-in">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Кастомные стрелки Swiper */}
        <style>{`
          .swiper-button-next, .swiper-button-prev {
            color: #6366f1;
            background: white;
            border-radius: 9999px;
            box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
            width: 40px;
            height: 40px;
            top: 40%;
            transition: background 0.2s, color 0.2s;
          }
          .swiper-button-next:hover, .swiper-button-prev:hover {
            background: #6366f1;
            color: white;
          }
          .swiper-button-next:after, .swiper-button-prev:after {
            font-size: 20px;
            font-weight: bold;
          }
        `}</style>
      </div>
    </div>
  );
}; 