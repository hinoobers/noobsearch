import { useState } from 'react';
import './SearchPage.css'

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [time, setTime] = useState(null);

    const search = (query) => {
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
            <h1>Search Page</h1>
            <input type="text" placeholder="Search..." onChange={(e) => setQuery(e.target.value)}></input>
            <button onClick={() => search(query)}>Search</button>
            <div className='results'>
                <h2>Results {time !== null && `(in ${time} ms)`}</h2>
                {results.map((result, index) => (
                    <div key={index} className='result'>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</a>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SearchPage;