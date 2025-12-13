import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import { Mic, Brain, Zap, ArrowRight, Plus, Minus } from 'lucide-react';
import mobileScore from '../public/assets/mobile_score.png';
import mobileLanding from '../public/assets/mobile_landing.png';
import mobileCall from '../public/assets/mobile_call.jpg';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    useEffect(() => {
        AOS.refresh();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <section className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
                {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                        
                    <div className="absolute top-20 right-20 w-12 h-12 border-2 border-primary/30 rounded-lg rotate-45 animate-pulse"></div>
                    <div className="absolute bottom-40 left-20 w-16 h-16 border-2 border-secondary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div> */}


                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className='h-screen flex flex-col justify-center items-center'>
                    <h1 data-aos="fade-up" data-aos-anchor-placement="bottom-bottom" className="text-5xl md:text-7xl font-bold mb-6 mt-20">
                        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-slow">
                            Siapkan Karirmu
                        </span>
                        <br />
                        <span className="text-white">Dengan Interviu</span>
                    </h1>

                    <p data-aos="fade-up" data-aos-anchor-placement="bottom-bottom" data-aos-delay="80" className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Latihan wawancara realistis dengan teknologi AI berbahasa Indonesia.
                        Dapatkan feedback instan, tingkatkan kemampuan, dan raih pekerjaan atau beasiswa impianmu.
                    </p>

                    <div data-aos="fade-up" data-aos-delay="500" data-aos-anchor-placement="bottom-bottom" className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <button
                            onClick={onGetStarted}
                            className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 flex items-center gap-3"
                        >
                            Mulai Sekarang
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    </div>

                    {/* Mobile Mockup Section */}
                    <div data-aos="fade-up" data-aos-delay="160" className="relative w-full max-w-5xl mx-auto h-[calc(100vh-200px)] md:h-screen perspective-1000">
                        {/* Left Phone - Secondary */}
                        <div data-aos="fade-right" className="absolute top-10 left-0 md:left-20 w-[240px] md:w-[280px] z-10 transform -rotate-6 translate-y-12 opacity-80 scale-90 hidden md:block animate-float-delayed">
                            <PhoneMockup>
                                <div className="w-full h-full bg-dark pt-10">
                                    <img src={mobileScore} alt="Mobile Score" className="w-full h-full object-cover object-top rounded-t-2xl" />
                                </div>
                            </PhoneMockup>
                        </div>

                        {/* Right Phone - Secondary */}
                        <div data-aos="fade-left" className="absolute top-10 right-0 md:right-20 w-[240px] md:w-[280px] z-10 transform rotate-6 translate-y-12 opacity-80 scale-90 hidden md:block animate-float-delayed" style={{ animationDelay: '1.5s' }}>
                            <PhoneMockup>
                                <img src={mobileCall} alt="Mobile Call Session" className="w-full h-full object-cover" />
                            </PhoneMockup>
                        </div>

                        {/* Center Phone - Main */}
                        <div data-aos-delay="200" className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[280px] md:w-[320px] z-20 animate-float">
                            <PhoneMockup isMain>
                                <img src={mobileLanding} alt="Mobile App Interface" className="w-full h-full object-cover" />
                            </PhoneMockup>
                        </div>
                    </div>

                    <div id="features" data-aos="fade-up"  className=" grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
                        <FeatureCard
                        
                            icon={<Mic className="w-8 h-8" />}
                            title="Interaksi Suara"
                            description="Percakapan natural dengan AI interviewer menggunakan pengenalan suara canggih"
                            gradient="from-primary/10 to-primary/5"
                        />
                        <FeatureCard
                            icon={<Brain className="w-8 h-8" />}
                            title="Feedback Cerdas"
                            description="Dapatkan wawasan pintar dan tips personal untuk meningkatkan jawaban Anda"
                            gradient="from-secondary/10 to-secondary/5"
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Latihan Instan"
                            description="Mulai latihan segera untuk wawancara kerja atau beasiswa"
                            gradient="from-primary/10 to-secondary/5"
                        />
                    </div>

                    {/* FAQ Section */}
                    <div className="min-h-screen w-full flex flex-col justify-center max-w-6xl mx-auto mt-20 mb-20 relative z-10">
                        <div data-aos="fade-up" className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                                Pertanyaan Umum
                            </h2>
                            <p className="text-slate-400">
                                Hal-hal yang sering ditanyakan seputar Interviu
                            </p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient, }) => {
    return (
        <div className={`group p-6 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-primary/10`}>
            <div className="flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
};

const faqs = [
    {
        question: "Apa itu Interviu?",
        answer: "Interviu adalah platform latihan wawancara cerdas berbasis AI yang dirancang untuk membantu Anda mengasah kemampuan komunikasi, mendapatkan feedback instan, dan mempersiapkan diri menghadapi wawancara kerja atau beasiswa dengan percaya diri."
    },
    {
        question: "Apakah layanan ini gratis?",
        answer: "Ya, Anda dapat memulai latihan wawancara secara gratis. Kami percaya bahwa setiap orang berhak mendapatkan kesempatan untuk mempersiapkan karir mereka dengan sebaik mungkin tanpa hambatan biaya."
    },
    {
        question: "Bagaimana cara kerja feedback AI?",
        answer: "Sistem AI kami menganalisis jawaban Anda secara real-time, memperhatikan aspek seperti intonasi, kejelasan, relevansi jawaban, dan memberikan saran konstruktif untuk perbaikan segera."
    },
    {
        question: "Apakah suara saya direkam?",
        answer: "Privasi Anda adalah prioritas kami. Suara Anda hanya diproses secara real-time untuk keperluan simulasi dan tidak disimpan secara permanen di server kami."
    }
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // When FAQ expands/collapses ensure AOS recalculates positions
        AOS.refresh();
    }, [isOpen]);

    return (
         <div
            className={`border rounded-xl transition-all duration-300 ${isOpen
                ? 'bg-surface/80 border-primary/50 shadow-lg shadow-primary/10'
                : 'bg-surface/30 border-white/10 hover:bg-surface/50'
                }`}
                data-aos="fade-up"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left"
            >
                <span className={`font-semibold text-lg ${isOpen ? 'text-primary' : 'text-white'}`}>
                    {question}
                </span>
                <span className={`p-2 rounded-full transition-colors duration-300 ${isOpen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400'}`}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 text-slate-300 leading-relaxed border-t border-white/5 mt-2 text-left">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const PhoneMockup: React.FC<{ children: React.ReactNode; isMain?: boolean }> = ({ children, isMain }) => {
    return (
        <div className={`relative mx-auto bg-gray-900 rounded-[3rem] border-[10px] border-gray-900 shadow-2xl ${isMain ? 'shadow-primary/30' : 'shadow-xl'}`}>
            {/* Side Buttons */}
            {/* Silent Switch */}
            <div className="absolute top-24 -left-[14px] w-[4px] h-7 bg-gray-800 rounded-l-md shadow-sm"></div>
            {/* Volume Up */}
            <div className="absolute top-40 -left-[14px] w-[4px] h-12 bg-gray-800 rounded-l-md shadow-sm"></div>
            {/* Volume Down */}
            <div className="absolute top-56 -left-[14px] w-[4px] h-12 bg-gray-800 rounded-l-md shadow-sm"></div>
            {/* Power Button */}
            <div className="absolute top-44 -right-[14px] w-[4px] h-16 bg-gray-800 rounded-r-md shadow-sm"></div>

            {/* Screen Container with Bezel */}
            <div className="relative rounded-[2.3rem] overflow-hidden w-full h-full bg-black border-[2px] border-gray-800 aspect-[9/19.5] ring-1 ring-white/10">
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-[30%] h-7 bg-black rounded-full z-30 flex justify-center items-center shadow-lg">
                    {/* Camera lens simulated */}
                    <div className="w-16 h-4 bg-black rounded-full flex items-center justify-end pr-2">
                        <div className="w-2 h-2 rounded-full bg-blue-900/30"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-full relative z-10 bg-dark">
                    {children}
                </div>

                {/* Glass Reflection Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none z-20 rounded-[2.3rem]"></div>
            </div>
        </div>
    );
};

export default LandingPage;
