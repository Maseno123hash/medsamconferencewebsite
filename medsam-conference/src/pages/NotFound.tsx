import { Link } from 'react-router-dom'
import { Home, Send, FileText } from 'lucide-react'
import { Seo } from '../components/ui/Seo'

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" />
      <section className="section bg-navy-950">
        <div className="container-x flex flex-col items-center py-16 text-center">
          <p className="font-mono text-7xl font-black text-gold-400">404</p>
          <h1 className="mt-4 text-3xl font-black text-white">This page doesn't exist</h1>
          <p className="mt-3 max-w-md text-navy-200">
            The page you're looking for may have moved. Let's get you back to the conference.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-gold">
              <Home size={16} /> Back to Home
            </Link>
            <Link to="/registration" className="btn btn-outline-light">
              <Send size={16} /> Register
            </Link>
            <Link to="/abstracts" className="btn btn-outline-light">
              <FileText size={16} /> Submit Abstract
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
