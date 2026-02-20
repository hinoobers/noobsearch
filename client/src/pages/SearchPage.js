import { useState } from 'react';
import './SearchPage.css'
import Navbar from '../components/Navbar';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [time, setTime] = useState(null);

    const search = (query) => {
        if(query.trim() === "") {
            return;
        }
        fetch(`http://localhost:3001/search?q=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                setResults(data.results);
                setTime(data.time);
            })
            .catch(err => {
                console.error(err);
            });
    }
    return (
        <div className='search'>
            <Navbar />
            <h1>noobsearch</h1>
            <input autofocus type="text" placeholder="Search..." onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search(query)}></input>
            <button className="search-button" onClick={() => search(query)}>Search</button>
            <div className='results'>
                <h2>Results {time !== null && `(in ${time} ms)`}</h2>
                {results.map((result, index) => (
                    <div key={index} className='result'>
                        <div className='result-header'>
                            <img src={`https://www.google.com/s2/favicons?domain=${result.url}`} alt="favicon" className='favicon' width={32} height={32} />
                            <a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</a>
                        </div>
                        <p>{result.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SearchPage;