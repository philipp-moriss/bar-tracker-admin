import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useForm as useGetForm } from '@/core/hooks/api/useForm'
import { useEffect, useState, useRef } from 'react'

export const LoadingMessage = () => {
    const { t, i18n } = useTranslation()
    const { formId } = useParams()
    const { data: form } = useGetForm(formId!)
    const [phraseIdx, setPhraseIdx] = useState(0)
    const [fade, setFade] = useState(true)
    const gifRef = useRef<HTMLImageElement>(null)
    const textRef = useRef<HTMLSpanElement>(null)

    // Получаем массив фраз из i18n
    const phrases: string[] = t('survey.loading.phrases', { returnObjects: true }) as string[];

    // Установка языка формы при загрузке
    useEffect(() => {
        if (form?.language) {
            i18n.changeLanguage(form.language);
        }
    }, [form?.language, i18n]);

    const isRTL = form?.language === 'ar' || form?.language === 'he';

    // Синхронизация с гифкой
    useEffect(() => {
        const animate = () => {
            if (textRef.current) {
                // Принудительно включаем GPU и вызываем reflow
                textRef.current.style.transform = 'translate3d(0,0,0)';
            }
            
            setFade(false);
            
            // Используем requestAnimationFrame для лучшей синхронизации
            requestAnimationFrame(() => {
                setTimeout(() => {
                    setPhraseIdx((prev) => (prev + 1) % phrases.length);
                    setFade(true);
                }, 150);
            });
        };

        // Запускаем анимацию каждые 2.5 секунды
        const interval = setInterval(animate, 2500);
        
        // Запускаем первую анимацию с задержкой для стабильности
        const initialTimeout = setTimeout(() => {
            if (textRef.current) {
                // Принудительная инициализация
                textRef.current.style.opacity = '1';
            }
            animate();
        }, 300);
        
        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, [phrases.length]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-background p-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <img
                ref={gifRef}
                src="/Robot.gif"
                alt="Loading bot"
                className="mb-4"
            />
            <span
                ref={textRef}
                className={`inline-block text-center dark:text-foreground min-h-[48px] transition-opacity duration-150 ease-in-out will-change-opacity ${fade ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    WebkitTransition: 'opacity 150ms ease-in-out',
                    WebkitTransform: 'translate3d(0,0,0)',
                    transform: 'translate3d(0,0,0)',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden'
                }}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {phrases[phraseIdx]?.split('\n').map((line, idx) => (
                    <span key={idx}>
                        {line}
                        {idx !== phrases[phraseIdx].split('\n').length - 1 && <br />}
                    </span>
                ))}
            </span>
        </div>
    );
}
