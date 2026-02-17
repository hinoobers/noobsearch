import { useEffect, useState } from 'react';
import './SearchPage.css'
import Navbar from '../components/Navbar';

const StatisticsPage = () => {
    const handle = (e) => {
        e.preventDefault();
        const url = e.target[0].value;
        if(!url.trim()) return;

        fetch('http://localhost:3001/crawlsite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        }).then(res => res.json())
        .then(data => {
            if(data.ok) {
                alert(data.message);
            } else {
                alert("Error: " + data.error);
            }   
        }).catch(err => {
            console.error(err);
            alert("An error occurred while submitting the site.");
        });
    }
    return (
        <div className='search'>
            <Navbar />
            <h1>Add your site</h1>
            <p>Don't see your site when you search for something? Submit it here.</p>

            <form onSubmit={handle}>
                <input type="text" placeholder="https://example.com" />
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default StatisticsPage;