import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import './Landing.css';

const Landing = () => {
    const loginRef = useRef(null);
    const [showAbout, setShowAbout] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const scrollToLogin = () => {
        if (loginRef.current) {
            loginRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <React.Fragment>
        <div className='landing-container'>
            <div className='landing-bg' aria-hidden='true'>
                <div className='blob blob-1' />
                <div className='blob blob-2' />
                <div className='blob blob-3' />
            </div>

            <header className='landing-nav'>
                <motion.div
                    className='brand'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <span className='brand-dot' />
                    <span className='brand-name'>EchoCare</span>
                </motion.div>

                <motion.nav
                    className='nav-links'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                >
                    <button type="button" className="nav-link" onClick={() => setShowAbout(true)} style={{background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit'}}>About</button>
                    <button type="button" className="nav-link" onClick={() => setShowHelp(true)} style={{background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit'}}>Help</button>
                    <button
                        type='button'
                        className='nav-cta'
                        onClick={scrollToLogin}
                    >
                        Sign In
                    </button>
                </motion.nav>
            </header>

            <section className='hero'>
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                >
                    Welcome to <span className='hero-accent'>EchoCare</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                    Your companion for better care — calm, connected, and always within reach.
                </motion.p>

                <motion.div
                    className='hero-actions'
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                >
                    <button
                        type='button'
                        onClick={scrollToLogin}
                        className='btn-primary'
                    >
                        Get Started
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M12 5v14M5 12l7 7 7-7' />
                        </svg>
                    </button>
                </motion.div>

                <motion.button
                    type='button'
                    aria-label='Scroll to sign in'
                    className='scroll-hint'
                    onClick={scrollToLogin}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <span>Scroll down</span>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M6 9l6 6 6-6' />
                    </svg>
                </motion.button>
            </section>



            <section ref={loginRef} className='login-section' id='login'>
                <motion.div
                    className='login-wrap'
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <div className='login-intro'>
                        <h2>Welcome back</h2>
                        <p>Sign in to continue your care journey securely and seamlessly.</p>
                    </div>

                    <Login hideBackLink={true} />
                </motion.div>
            </section>

            <footer className='landing-footer'>
                <span>© {new Date().getFullYear()} EchoCare</span>
                <span>Made with care</span>
            </footer>
        </div>

        <AnimatePresence>
            {showAbout && (
                <div className="modal-overlay" onClick={() => setShowAbout(false)}>
                    <motion.div 
                        className="simple-modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button className="close-modal" onClick={() => setShowAbout(false)}>✕</button>
                        <h2 className="modal-title">About</h2>
                        <p className="modal-body">
                            Aging independently shouldn't mean feeling isolated. We built EchoCare to act as an active, supportive companion that preserves dignity while providing crucial, real-time insights and relief to caregiving teams.
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {showHelp && (
                <div className="modal-overlay" onClick={() => setShowHelp(false)}>
                    <motion.div 
                        className="simple-modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button className="close-modal" onClick={() => setShowHelp(false)}>✕</button>
                        <h2 className="modal-title">Help & Support</h2>
                        <p className="modal-body">
                            For support, inquiries, or feedback, please reach out to our team:
                        </p>
                        <div className="modal-email-list">
                            <span className="modal-email-item">jalwajabbar@gmail.com</span>
                            <span className="modal-email-item">alkaroy33@gmail.com</span>
                            <span className="modal-email-item">fathimaansal81@gmail.com</span>
                            <span className="modal-email-item">kdeva0407@gmail.com</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        </React.Fragment>
    );
};

export default Landing;
