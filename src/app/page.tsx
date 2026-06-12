import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Vision from '../components/Vision';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Vision />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
