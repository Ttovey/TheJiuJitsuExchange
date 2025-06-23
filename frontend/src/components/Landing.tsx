import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import Navbar from './Navbar';
import landingImage from '../assets/images/landing_image.webp';
import benCoach from '../assets/images/ben_coach.png';
import kevinCoach from '../assets/images/kevin_coach.png';
import robertCoach from '../assets/images/robert_coach.png';
import reginaldDog from '../assets/images/dog_coach.png';

// Import gym images JSON
import gymImagesData from '../assets/images/gym/images.json';

interface LandingProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Landing: React.FC<LandingProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // Gym carousel state
  const gymImages = Object.values(gymImagesData);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Side nav state
  const [activeSection, setActiveSection] = useState<string>('welcome');
  const [showSideNav, setShowSideNav] = useState<boolean>(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // FAQ state
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // Auto-rotate gym images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % gymImages.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [gymImages.length]);

  // Side nav scroll detection and section tracking
  useEffect(() => {
    const handleScroll = () => {
      // Show side nav when user starts scrolling (anywhere on the page)
      setShowSideNav(true);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to hide nav after 3 seconds
      const newTimeout = setTimeout(() => {
        setShowSideNav(false);
      }, 3000);
      
      setScrollTimeout(newTimeout);
    };

    const observerOptions = {
      threshold: 0.3,
      rootMargin: '-100px 0px -100px 0px'
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  const scrollToSection = (sectionId: string): void => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const toggleFAQ = (index: number): void => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "I've never trained before. Where do I begin?",
      answer: "Head on over to the Sign Up page and select 1 Week Trial from the Membership options. You will be given a free week of classes to see if you enjoy Jiu-Jitsu and our gym. No credit card required, just sign the waiver and you are good to go."
    },
    {
      question: "What do I need for my first class?",
      answer: "Please arrive a minimum of 15 minutes early. This will give you time to meet the staff and instructors, complete a waiver if you haven't already, and change clothes if needed.\n\nIf you own a pair of flip flops bring them as no shoes are allowed on the mat and no bare feet are allowed off the mat. Flip flops make it easy to get on and off the mat quickly, if you need to go to the bathroom or grab a drink.\n\nA Gi is required for Gi class. If you don't own one we have some rentals available (depending on size).\n\nFor No-Gi class bring a rash guard and shorts. If its your first week a T-shirt is fine.\n\nWe currently sell rash guards and will sell shorts, Gi's and T-shirts soon."
    },
    {
      question: "What are your rates?",
      answer: "We charge a flat rate of $175 a month for unlimited classes. There are no contracts or high pressure sales tactics. Cancel anytime via text or email. (Feel free to sign up for the 1 week trial first)"
    },
    {
      question: "Staying hydrated.",
      answer: "We have water fountains as well as a bottle filler if you would like to bring your own bottle. We also sell Gatorade and energy drinks."
    },
    {
      question: "Do you accept drop-ins?",
      answer: "Absolutely. Drop-ins are always free. Just select the Drop-in option on the Sign Up page. Leave us a note in the \"questions\" field to let us know when you're coming."
    },
    {
      question: "Do I need to be in shape to start?",
      answer: "Absolutely not! While strength and conditioning helps in Jiu-Jitsu it is not required to start. Many students start training with little to no experience in other sports. You will get tired quickly when you first start, but your body will acclimate. You can rest as much as you need and will never be forced to roll if you don't want to."
    },
    {
      question: "Do I spar on day 1?",
      answer: "Only if you want to. Some people like to learn a few things before jumping into live sparring some people just like to hop in the deep end. Our coaches will let you know if they think you might benefit from sticking to technique for a little while but ultimately it is up to you."
    },
    {
      question: "Hygiene and Etiquette",
      answer: "Good hygiene in Jiu-Jitsu is non-negotiable—unless you want people tapping out before the roll even starts. Wash your gear after every class (no, the \"air dry\" method doesn't count), trim your nails, and wear deodorant. Keep those feet clean and slap on some sandals off the mat. A clean grappler is someone others want to roll with."
    },
    {
      question: "What is Jiu-Jitsu?",
      answer: "Jiu-Jitsu is a martial art and combat sport that focuses on grappling and ground fighting. It is designed to enable a smaller, weaker person to defend against and defeat a larger, stronger opponent using leverage, technique, and submissions like joint locks and chokeholds. There is no striking in class."
    }
  ];

  const sections = [
    { id: 'welcome', name: 'Welcome' },
    { id: 'coaches', name: 'Coaches' },
    { id: 'reginald', name: 'Reginald' },
    { id: 'schedule', name: 'Schedule' },
    { id: 'gym', name: 'The Gym' },
    { id: 'faq', name: 'FAQ' },
    { id: 'contact', name: 'Contact' }
  ];

  return (
    <div className="landing-page">
      {/* Side Navigation */}
      <div className={`side-nav ${showSideNav ? 'visible' : ''}`}>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`side-nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => scrollToSection(section.id)}
          >
            {section.name}
          </button>
        ))}
      </div>

      <Navbar user={user} setUser={setUser} showNavLinks={true} />
      
      <div className="hero-image-container">
        <img 
          src={landingImage} 
          alt="The Jiu-Jitsu Exchange" 
          className="hero-image"
        />
      </div>
      
      <div className="content-section" data-section="welcome">
        <div className="content-container">
          <h2 className="content-title">Welcome to The Jiu-Jitsu Exchange</h2>
          <h3 className="content-subtitle">The Place to Train</h3>
          
          <div className="content-text">
            <p>
              At The Exchange, we emphasize learning by doing. We encourage you to be a creator, not a robot. Our students experiment, share ideas, figure out what works and what doesn't.
            </p>
            
            <p className="highlight-text">
              Does it work? Do it.
            </p>
            
            <p>
              Our goal is to give you the tools you need to feel confident in every position. Confidence comes from success. Success comes from doing what works. We guide you along your journey to find the Jiu-Jitsu that works for you.
            </p>
            
            <p>
              Whether you're a seasoned competitor or stepping onto the mats for the first time, our doors are open. Classes are tailored to all levels, from beginners looking to build a strong foundation, to advanced practitioners seeking to refine their game.
            </p>
            
            <p className="closing-text">
              Come train more.
            </p>
            
            <div className="content-signup">
              <a 
                href="https://jjex.kicksite.net/public/landing_pages/f7fb044f-d340-453b-ae9a-e0d4865e8100/submission/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="signup-button"
              >
                Sign Up Now
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="coaches-section" data-section="coaches">
        <div className="coaches-container">
          <h2 className="coaches-title">Meet Our Coaches</h2>
          
          <div className="coaches-grid">
            <div className="coach-card">
              <div className="coach-image-wrapper">
                <img 
                  src={kevinCoach} 
                  alt="Kevin - Instructor" 
                  className="coach-image"
                />
              </div>
              <div className="coach-info">
                <h3 className="coach-name">Kevin</h3>
                <div className="coach-description">
                  <p className="coach-title-text">Instructor</p>
                  <p>Jiu-Jitsu Brown Belt</p>
                  <p>Professional MMA Fighter</p>
                  <p>Retired US Army veteran</p>
                </div>
              </div>
            </div>
            
            <div className="coach-card center-coach">
              <div className="coach-image-wrapper">
                <img 
                  src={robertCoach} 
                  alt="Robert - Head Instructor" 
                  className="coach-image"
                />
              </div>
              <div className="coach-info">
                <h3 className="coach-name">Robert</h3>
                <div className="coach-description">
                  <p className="coach-title-text">Head Instructor</p>
                  <p>Black belt under UFC, WEC and PRIDE veteran Jeff Curran, in the Pedro Sauer lineage</p>
                </div>
              </div>
            </div>
            
            <div className="coach-card">
              <div className="coach-image-wrapper">
                <img 
                  src={benCoach} 
                  alt="Ben - Instructor" 
                  className="coach-image"
                />
              </div>
              <div className="coach-info">
                <h3 className="coach-name">Ben</h3>
                <div className="coach-description">
                  <p className="coach-title-text">Instructor</p>
                  <p>Jiu-Jitsu Brown Belt</p>
                  <p>Under Robert Ellison</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dog-coach-section" data-section="reginald">
        <div className="dog-coach-container">
          <h2 className="dog-coach-intro">and the mighty Reginald Minn Choi</h2>
          
          <div className="dog-coach-card">
            <div className="dog-image-wrapper">
              <img 
                src={reginaldDog} 
                alt="Reginald Minn Choi - King of the Mat" 
                className="dog-image"
              />
            </div>
            <div className="dog-info">
              <h3 className="dog-name">Reginald Minn Choi</h3>
              <div className="dog-description">
                <p className="dog-title-text">King Of The Mat</p>
                <p>19 Stripe Coral belt</p>
                <p>Under Kramer lineage</p>
                <p>Fears no man only door knocks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="schedule-section" data-section="schedule">
        <div className="schedule-container">
          <h2 className="schedule-title">Schedule</h2>
          
          <div className="schedule-grid">
            <div className="day-schedule">
              <h3 className="day-name">Monday</h3>
              <div className="class-time">
                <span className="time">6:30PM - 7:30PM</span>
                <span className="class-type">No Gi Jiu-Jitsu</span>
                <span className="class-note">Fundamentals Break-Off Depending On Curriculum/Attendance</span>
              </div>
              <div className="class-time">
                <span className="time">7:30PM - 8:30PM</span>
                <span className="class-type">Open Sparring</span>
              </div>
            </div>

            <div className="day-schedule">
              <h3 className="day-name">Tuesday</h3>
              <div className="class-time">
                <span className="time">6:30PM - 7:30PM</span>
                <span className="class-type">Gi Jiu-Jitsu</span>
                <span className="class-note">Fundamentals Break-Off Depending On Curriculum/Attendance</span>
              </div>
              <div className="class-time">
                <span className="time">7:30PM - 8:30PM</span>
                <span className="class-type">Open Sparring</span>
              </div>
            </div>

            <div className="day-schedule">
              <h3 className="day-name">Wednesday</h3>
              <div className="class-time">
                <span className="time">6:30PM - 7:30PM</span>
                <span className="class-type">No Gi Jiu-Jitsu</span>
                <span className="class-note">Fundamentals Break-Off Depending On Curriculum/Attendance</span>
              </div>
              <div className="class-time">
                <span className="time">7:30PM - 8:30PM</span>
                <span className="class-type">Open Sparring</span>
              </div>
            </div>

            <div className="day-schedule">
              <h3 className="day-name">Thursday</h3>
              <div className="class-time">
                <span className="time">6:30PM - 7:30PM</span>
                <span className="class-type">Gi Jiu-Jitsu</span>
                <span className="class-note">Fundamentals Break-Off Depending On Curriculum/Attendance</span>
              </div>
              <div className="class-time">
                <span className="time">7:30PM - 8:30PM</span>
                <span className="class-type">Open Sparring</span>
              </div>
            </div>

            <div className="day-schedule">
              <h3 className="day-name">Friday</h3>
              <div className="class-time">
                <span className="time">6:30PM - 7:00PM</span>
                <span className="class-type">No Gi Weekly Wrap-Up</span>
              </div>
              <div className="class-time">
                <span className="time">7:00PM - 8:00PM</span>
                <span className="class-type">Open Sparring</span>
              </div>
            </div>

            <div className="day-schedule">
              <h3 className="day-name">Saturday</h3>
              <div className="class-time">
                <span className="time">11:00AM - 12:00PM</span>
                <span className="class-type">No Gi Jiu-Jitsu All Levels</span>
              </div>
              <div className="class-time">
                <span className="time">12:00PM - 1:30PM</span>
                <span className="class-type">Open Mat</span>
                <span className="class-note">Free and Open to All</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
             <div className="gym-section" data-section="gym">
         <div className="gym-container">
          <h2 className="gym-title">The Gym</h2>
          
          <div className="gym-carousel">
            <div className="gym-image-container">
              {gymImages.map((imageUrl, index) => (
                <img 
                  key={index}
                  src={imageUrl} 
                  alt={`The Jiu-Jitsu Exchange Gym ${index + 1}`}
                  className={`gym-image ${index === currentImageIndex ? 'active' : ''}`}
                />
              ))}
            </div>
            
            <div className="carousel-indicators">
              {gymImages.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`View gym image ${index + 1}`}
                />
              ))}
            </div>
            
            <div className="carousel-controls">
              <button
                className="carousel-btn prev-btn"
                onClick={() => setCurrentImageIndex((prevIndex) => 
                  prevIndex === 0 ? gymImages.length - 1 : prevIndex - 1
                )}
                aria-label="Previous image"
              >
                &#8249;
              </button>
              <button
                className="carousel-btn next-btn"
                onClick={() => setCurrentImageIndex((prevIndex) => 
                  (prevIndex + 1) % gymImages.length
                )}
                aria-label="Next image"
              >
                &#8250;
              </button>
            </div>
          </div>
                </div>
      </div>
      
      <div className="faq-section" data-section="faq">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle">
            If you can't find the answer you're looking for, feel free to reach out via text{' '}
            <a href="tel:+19849999286" className="faq-contact-link">(984) 999-9286</a>, email{' '}
            <a href="mailto:info@thejiujitsuexchange.com" className="faq-contact-link">info@thejiujitsuexchange.com</a>, or the contact form.
          </p>
          
          <div className="faq-list">
            {faqData.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openFAQ === index ? 'active' : ''}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{openFAQ === index ? '−' : '+'}</span>
                </button>
                <div className={`faq-answer ${openFAQ === index ? 'open' : ''}`}>
                  <div className="faq-answer-content">
                    {faq.answer.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="footer" data-section="contact">
         <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-heading">Follow</h4>
              <a 
                href="https://www.instagram.com/thejiujitsuexchange/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="instagram-link"
              >
                📸 @thejiujitsuexchange
              </a>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-heading">Join Us</h4>
              <a 
                href="https://jjex.kicksite.net/public/landing_pages/f7fb044f-d340-453b-ae9a-e0d4865e8100/submission/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="signup-button"
              >
                Sign Up Now
              </a>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-heading">Location</h4>
              <address className="address">
                8813 Gulf Ct Unit I<br />
                Raleigh, North Carolina 27617<br />
                <a href="tel:+19849999286" className="phone-link">(984) 999-9286</a>
              </address>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">
              Copyright © 2025 The Jiu-Jitsu Exchange - All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 