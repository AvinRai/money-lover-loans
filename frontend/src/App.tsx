import './App.css'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { TrustStrip } from './components/TrustStrip'
import { Roles } from './components/Roles'
import { Steps } from './components/Steps'
import { Cta } from './components/Cta'
import { Footer } from './components/Footer'

function App() {
  return (
    <div className="site">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Roles />
        <Steps />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

export default App
