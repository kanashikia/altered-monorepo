import { useState, useEffect, useMemo } from 'react'
import './App.css'

function App() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Filters
  const [factionFilter, setFactionFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Sorting
  const [sortColumn, setSortColumn] = useState('nom')
  const [sortDirection, setSortDirection] = useState('asc')

  // Vendor stock checker
  const [vendorStock, setVendorStock] = useState('')
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [vendorResults, setVendorResults] = useState([])
  const [showNoResults, setShowNoResults] = useState(false)
  const [vendorFaction, setVendorFaction] = useState('')

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load from local CSV file only (backend calls disabled temporarily)
      const response = await fetch('/missing_cards.csv')
      if (!response.ok) {
        throw new Error('Could not load local CSV file')
      }

      const csvText = await response.text()
      const parsedCards = parseCSV(csvText)

      setCards(parsedCards)
      setLastUpdate(new Date())

      // Save to localStorage for persistence
      localStorage.setItem('alteredCards', JSON.stringify(parsedCards))
      localStorage.setItem('lastUpdate', new Date().toISOString())
    } catch (err) {
      setError(`Erreur lors du chargement des données: ${err.message}`)

      // Try to load from localStorage as fallback
      const savedCards = localStorage.getItem('alteredCards')
      const savedUpdate = localStorage.getItem('lastUpdate')
      if (savedCards) {
        setCards(JSON.parse(savedCards))
        setLastUpdate(new Date(savedUpdate))
      }
    } finally {
      setLoading(false)
    }
  }

  // Parse JSON data from API
  const parseJSON = (jsonData) => {
    let cardsArray = []

    // Handle if jsonData is a string
    if (typeof jsonData === 'string') {
      try {
        cardsArray = JSON.parse(jsonData)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        return []
      }
    } else {
      cardsArray = jsonData
    }

    // If it's not an array, return empty
    if (!Array.isArray(cardsArray)) {
      console.error('JSON data is not an array')
      return []
    }

    return cardsArray.map((card, index) => {
      // Extract rarity reference and convert to lowercase
      const rarityRef = card.rarity?.reference?.toLowerCase() || 'common'

      // Map COMMON/RARE/UNIQUE to commun/rare/unique
      let rarity = rarityRef
      if (rarityRef === 'common') rarity = 'commun'

      // Extract faction name
      const factionName = card.mainFaction?.name || ''

      return {
        id: index,
        reference: card.reference || '',
        nom: card.name || '',
        rarete: rarity,
        faction: factionName,
        possedees: 0, // Will be calculated by backend
        manquantes: 0, // Will be calculated by backend
        lowerPrice: 0, // Will be provided by backend
        totalCost: 0 // Will be calculated by backend
      }
    })
  }

  // Deduplicate cards: keep only the cheapest version for each name/faction/rarity combination
  const deduplicateCards = (cards) => {
    const cardMap = new Map()

    cards.forEach(card => {
      // Create a unique key based on name, faction, and rarity
      const key = `${card.nom}|${card.faction}|${card.rarete}`.toLowerCase()

      const existing = cardMap.get(key)

      if (!existing) {
        // First time seeing this card combination
        cardMap.set(key, card)
      } else {
        // Compare prices - keep the cheaper one
        // If prices are equal, keep the one with lower reference (A before B)
        if (card.lowerPrice < existing.lowerPrice ||
            (card.lowerPrice === existing.lowerPrice && card.reference < existing.reference)) {
          cardMap.set(key, card)
        }
      }
    })

    // Return deduplicated cards as array and reindex them
    return Array.from(cardMap.values()).map((card, index) => ({
      ...card,
      id: index
    }))
  }

  // Parse CSV data
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n')

    // Detect separator (comma or tab)
    const separator = lines[0].includes('\t') ? '\t' : ','

    const allCards = lines.slice(1).map((line, index) => {
      // Handle CSV with quotes
      let values
      if (separator === ',') {
        // Parse CSV with proper quote handling
        values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
      } else {
        values = line.split('\t').map(v => v.trim())
      }

      return {
        id: index,
        reference: values[0] || '',
        nom: values[1] || '',
        rarete: values[2]?.toLowerCase() || '',
        faction: values[3] || '',
        possedees: parseInt(values[4]) || 0,
        manquantes: parseInt(values[5]) || 0,
        lowerPrice: parseFloat(values[6]) || 0,
        totalCost: parseFloat(values[7]) || 0
      }
    })

    // Deduplicate cards to keep only the cheapest versions
    return deduplicateCards(allCards)
  }

  // Load data on mount
  useEffect(() => {
    fetchData()

    // Check for daily updates
    const savedUpdate = localStorage.getItem('lastUpdate')
    if (savedUpdate) {
      const lastUpdateDate = new Date(savedUpdate)
      const today = new Date()
      const daysSinceUpdate = Math.floor((today - lastUpdateDate) / (1000 * 60 * 60 * 24))

      if (daysSinceUpdate >= 1) {
        fetchData()
      } else {
        const savedCards = localStorage.getItem('alteredCards')
        if (savedCards) {
          setCards(JSON.parse(savedCards))
          setLastUpdate(lastUpdateDate)
          setLoading(false)
        }
      }
    }
  }, [])

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards]

    // Apply filters
    if (factionFilter !== 'all') {
      result = result.filter(card => card.faction.toLowerCase() === factionFilter.toLowerCase())
    }

    if (rarityFilter !== 'all') {
      result = result.filter(card => card.rarete.toLowerCase() === rarityFilter.toLowerCase())
    }

    if (searchTerm) {
      result = result.filter(card =>
        card.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [cards, factionFilter, rarityFilter, searchTerm, sortColumn, sortDirection])

  // Calculate statistics
  const stats = useMemo(() => {
    const filtered = filteredAndSortedCards
    return {
      totalCards: filtered.length,
      totalMissing: filtered.reduce((sum, card) => sum + card.manquantes, 0),
      totalOwned: filtered.reduce((sum, card) => sum + card.possedees, 0),
      totalCost: filtered.reduce((sum, card) => sum + (card.totalCost || 0), 0)
    }
  }, [filteredAndSortedCards])

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Export filtered data to CSV
  const exportToCSV = () => {
    const headers = ['Reference', 'Nom', 'Rareté', 'Faction', 'Possédées', 'Manquantes', 'Prix unitaire (€)', 'Coût total (€)']
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedCards.map(card => [
        `"${card.reference}"`,
        `"${card.nom}"`,
        `"${card.rarete}"`,
        `"${card.faction}"`,
        card.possedees,
        card.manquantes,
        card.lowerPrice ? card.lowerPrice.toFixed(2) : '0.00',
        card.totalCost ? card.totalCost.toFixed(2) : '0.00'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `altered_collection_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get faction badge class
  const getFactionClass = (faction) => {
    return `faction-badge faction-${faction.toLowerCase()}`
  }

  // Get rarity badge class
  const getRarityClass = (rarity) => {
    return `rarity-badge rarity-${rarity.toLowerCase()}`
  }

  // Parse vendor stock
  const parseVendorStock = (stockText) => {
    const lines = stockText.trim().split('\n')
    const stockMap = {}
    let detectedFaction = ''

    console.log('Parsing vendor stock, total lines:', lines.length)

    for (const line of lines) {
      // Check if this line contains a faction name (more flexible)
      const trimmedLine = line.trim().toUpperCase()
      if (trimmedLine === 'ORDIS' || trimmedLine === 'LYRA' || trimmedLine === 'AXIOM' ||
          trimmedLine === 'BRAVOS' || trimmedLine === 'MUNA' || trimmedLine === 'YZMIR') {
        detectedFaction = trimmedLine.charAt(0) + trimmedLine.slice(1).toLowerCase()
        console.log('✅ Detected faction:', detectedFaction, 'from line:', line)
        continue
      }

      // Skip header lines and empty lines
      if (!line.trim() || line.toLowerCase().includes('nom') || line.toLowerCase().includes('qtt')) {
        continue
      }

      // Parse format: "BTG-124    Troupière Ordis    1"
      // More flexible regex to handle various spacing
      const match = line.match(/([A-Z]+-\d+)\s+(.+)\s+(\d+)\s*$/)
      if (match) {
        const [, reference, name, quantity] = match
        const ref = reference.trim()
        stockMap[ref] = {
          reference: ref,
          name: name.trim(),
          quantity: parseInt(quantity)
        }
        console.log('Parsed card:', ref, '->', name.trim(), '(qty:', quantity + ')')
      } else {
        console.log('Could not parse line:', line)
      }
    }

    console.log('Total cards parsed:', Object.keys(stockMap).length)
    setVendorFaction(detectedFaction)
    return { stockMap, detectedFaction }
  }

  // Check vendor stock against missing cards
  const checkVendorStock = () => {
    if (!vendorStock.trim()) {
      console.log('No vendor stock provided')
      return
    }

    console.log('Starting vendor stock check...')
    const { stockMap, detectedFaction } = parseVendorStock(vendorStock)
    const results = []

    console.log('Checking against', cards.length, 'cards in collection')
    console.log('Vendor faction detected:', detectedFaction || 'NONE')

    // Create a name-based index from vendor stock for faster lookup
    const vendorByName = {}
    Object.values(stockMap).forEach(vendorCard => {
      const normalizedName = vendorCard.name.toLowerCase().trim()
      vendorByName[normalizedName] = vendorCard
    })

    console.log('Vendor cards indexed:', Object.keys(vendorByName).length)

    // Track which cards we've already added (to avoid duplicates)
    const addedCards = new Set()

    // For each card in our collection
    cards.forEach(card => {
      if (card.manquantes === 0) {
        return // Skip if we don't need this card
      }

      // Filter by faction if detected - STRICT MATCHING
      if (detectedFaction) {
        const cardFaction = card.faction.toLowerCase().trim()
        const vendorFaction = detectedFaction.toLowerCase().trim()

        if (cardFaction !== vendorFaction) {
          // Only log first few to avoid spam
          if (results.length < 5) {
            console.log('Skipping', card.nom, '- Faction mismatch:', cardFaction, '!==', vendorFaction)
          }
          return // Skip cards that don't match the vendor's faction
        }
      }

      // Try to match by card name (normalized)
      const normalizedCardName = card.nom.toLowerCase().trim()
      const vendorCard = vendorByName[normalizedCardName]

      if (vendorCard && vendorCard.quantity > 0) {
        // Create a unique key for this card (name + faction + rarity)
        const cardKey = `${card.nom}_${card.faction}_${card.rarete}`

        // Skip if we've already added this exact card
        if (addedCards.has(cardKey)) {
          console.log('Skipping duplicate:', card.nom, card.faction, card.rarete)
          return
        }

        // Calculate how many we should buy
        const currentOwned = card.possedees
        const needed = Math.min(3 - currentOwned, card.manquantes)
        const canBuy = Math.min(needed, vendorCard.quantity)

        console.log('Match found:', vendorCard.reference, card.nom, '- Faction:', card.faction, '- Rareté:', card.rarete, '- Need:', needed, '- Vendor has:', vendorCard.quantity, '- Buy:', canBuy)

        if (canBuy > 0) {
          addedCards.add(cardKey)
          results.push({
            reference: vendorCard.reference,
            nom: card.nom,
            faction: card.faction,
            rarete: card.rarete,
            currentOwned: currentOwned,
            needed: needed,
            vendorHas: vendorCard.quantity,
            toBuy: canBuy,
            lowerPrice: card.lowerPrice || 0,
            totalCost: (card.lowerPrice || 0) * canBuy,
            priority: card.rarete === 'unique' ? 3 : card.rarete === 'rare' ? 2 : 1
          })
        }
      }
    })

    console.log('Total matches found:', results.length)

    // Sort by priority (unique > rare > common) then by name
    results.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.nom.localeCompare(b.nom)
    })

    setVendorResults(results)
    setShowNoResults(results.length === 0)
    console.log('Vendor results set:', results.length, 'cards')
  }

  // Export vendor results to CSV
  const exportVendorResults = () => {
    if (vendorResults.length === 0) return

    const headers = ['Reference', 'Nom', 'Rareté', 'Faction', 'Possédées', 'Manquantes', 'Vendeur a', 'À acheter', 'Prix unitaire (€)', 'Coût total (€)']
    const csvContent = [
      headers.join(','),
      ...vendorResults.map(card => [
        `"${card.reference}"`,
        `"${card.nom}"`,
        `"${card.rarete}"`,
        `"${card.faction}"`,
        card.currentOwned,
        card.needed,
        card.vendorHas,
        card.toBuy,
        card.lowerPrice ? card.lowerPrice.toFixed(2) : '0.00',
        card.totalCost ? card.totalCost.toFixed(2) : '0.00'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `vendor_shopping_list_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Altered TCG - Collection Tracker</h1>
        <p className="subtitle">Gérez votre collection de cartes Altered</p>
        {lastUpdate && (
          <p className="subtitle">
            Dernière mise à jour: {lastUpdate.toLocaleDateString('fr-FR')} à {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        )}
      </header>

      {loading ? (
        <div className="loading">Chargement des données...</div>
      ) : error && cards.length === 0 ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-value">{stats.totalCards}</span>
              <span className="stat-label">Cartes affichées</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalMissing}</span>
              <span className="stat-label">Total manquantes</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalOwned}</span>
              <span className="stat-label">Total possédées</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalCost.toFixed(2)} €</span>
              <span className="stat-label">Coût total estimé</span>
            </div>
          </div>

          <div className="controls">
            <div className="control-group">
              <label>Rechercher</label>
              <input
                type="text"
                placeholder="Nom ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Faction</label>
              <select value={factionFilter} onChange={(e) => setFactionFilter(e.target.value)}>
                <option value="all">Toutes les factions</option>
                <option value="lyra">Lyra</option>
                <option value="axiom">Axiom</option>
                <option value="bravos">Bravos</option>
                <option value="muna">Muna</option>
                <option value="ordis">Ordis</option>
                <option value="yzmir">Yzmir</option>
              </select>
            </div>

            <div className="control-group">
              <label>Rareté</label>
              <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}>
                <option value="all">Toutes les raretés</option>
                <option value="commun">Commun</option>
                <option value="rare">Rare</option>
                <option value="unique">Unique</option>
              </select>
            </div>

            <div className="control-group">
              <label>Actions</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={fetchData}>Actualiser</button>
                <button onClick={exportToCSV}>Exporter CSV</button>
                <button onClick={() => setShowVendorModal(true)}>Vérifier Vendeur</button>
              </div>
            </div>
          </div>

          {/* Vendor Stock Modal */}
          {showVendorModal && (
            <div className="modal-overlay" onClick={() => setShowVendorModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Vérifier Stock Vendeur</h2>
                <p className="modal-subtitle">
                  Collez le stock du vendeur (format: BTG-124 Nom 1)
                </p>
                <textarea
                  className="vendor-input"
                  value={vendorStock}
                  onChange={(e) => setVendorStock(e.target.value)}
                  placeholder="ORDIS&#10;Nom        Qtt&#10;BTG-124    Troupière Ordis    1&#10;BTG-125    Héraut de Papier    2&#10;..."
                  rows={15}
                />
                <div className="modal-actions">
                  <button onClick={() => {
                    checkVendorStock()
                    setShowVendorModal(false)
                  }}>
                    Analyser
                  </button>
                  <button onClick={() => setShowVendorModal(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Results Message */}
          {showNoResults && (
            <div className="vendor-no-results">
              <h3>❌ Aucune correspondance trouvée</h3>
              <p>Le vendeur ne possède aucune carte dont vous avez besoin.</p>
              <p className="hint">Vérifiez que :</p>
              <ul>
                <li>Votre base de données de cartes est à jour</li>
                <li>Le format du stock vendeur est correct (BTG-XXX Nom Quantité)</li>
                <li>Vous avez bien des cartes manquantes dans votre collection</li>
              </ul>
              <button onClick={() => setShowNoResults(false)}>Fermer</button>
            </div>
          )}

          {/* Vendor Results */}
          {vendorResults.length > 0 && (
            <div className="vendor-results">
              <div className="vendor-results-header">
                <div>
                  <h2>
                    Liste d'Achat {vendorFaction && `- ${vendorFaction}`}
                  </h2>
                  <p className="vendor-summary">
                    {vendorResults.length} types de cartes • {vendorResults.reduce((sum, card) => sum + card.toBuy, 0)} cartes au total • Coût estimé: {vendorResults.reduce((sum, card) => sum + (card.totalCost || 0), 0).toFixed(2)} €
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={exportVendorResults}>Exporter Liste</button>
                  <button onClick={() => setVendorResults([])}>Fermer</button>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Nom</th>
                      <th>Rareté</th>
                      <th>Faction</th>
                      <th>Possédées</th>
                      <th>Manquantes</th>
                      <th>Vendeur a</th>
                      <th>À acheter</th>
                      <th>Prix unitaire (€)</th>
                      <th>Coût total (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorResults.map((card, index) => (
                      <tr key={index}>
                        <td>{card.reference}</td>
                        <td>{card.nom}</td>
                        <td>
                          <span className={getRarityClass(card.rarete)}>{card.rarete}</span>
                        </td>
                        <td>
                          <span className={getFactionClass(card.faction)}>{card.faction}</span>
                        </td>
                        <td>{card.currentOwned}</td>
                        <td>{card.needed}</td>
                        <td>{card.vendorHas}</td>
                        <td><strong>{card.toBuy}</strong></td>
                        <td>{card.lowerPrice ? card.lowerPrice.toFixed(2) : '-'}</td>
                        <td><strong>{card.totalCost ? card.totalCost.toFixed(2) : '-'}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredAndSortedCards.length === 0 ? (
            <div className="no-data">Aucune carte ne correspond à vos critères de recherche</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('reference')}>
                      Référence
                      {sortColumn === 'reference' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('nom')}>
                      Nom
                      {sortColumn === 'nom' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('rarete')}>
                      Rareté
                      {sortColumn === 'rarete' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('faction')}>
                      Faction
                      {sortColumn === 'faction' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('possedees')}>
                      Possédées
                      {sortColumn === 'possedees' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('manquantes')}>
                      Manquantes
                      {sortColumn === 'manquantes' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('lowerPrice')}>
                      Prix unitaire (€)
                      {sortColumn === 'lowerPrice' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('totalCost')}>
                      Coût total (€)
                      {sortColumn === 'totalCost' && (
                        <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCards.map((card) => (
                    <tr key={card.id}>
                      <td>{card.reference}</td>
                      <td>{card.nom}</td>
                      <td>
                        <span className={getRarityClass(card.rarete)}>{card.rarete}</span>
                      </td>
                      <td>
                        <span className={getFactionClass(card.faction)}>{card.faction}</span>
                      </td>
                      <td>{card.possedees}</td>
                      <td>{card.manquantes}</td>
                      <td>{card.lowerPrice ? card.lowerPrice.toFixed(2) : '-'}</td>
                      <td>{card.totalCost ? card.totalCost.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App