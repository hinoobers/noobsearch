import { useState } from 'react';
import './SearchPage.css'

const SearchPage = () => {
    const [query, setQuery] = useState('');
    
    const search = (query) => {
        fetch(`http://localhost:3001/search?q=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
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
                <h2>Results</h2>
            </div>
        </div>
    )
}

export default SearchPage;