import './App.css'
import { ArtworkTable } from '@/components'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Artwork Data Table</h1>
        <p>Art Institute of Chicago Collection</p>
      </header>
      <main className="app-main">
        <ArtworkTable />
      </main>
    </div>
  )
}

export default App
