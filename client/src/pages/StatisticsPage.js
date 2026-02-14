import { useEffect, useState } from 'react';
import './SearchPage.css'
import Navbar from '../components/Navbar';

const StatisticsPage = () => {
    const [indexedPages, setIndexedPages] = useState(0);
    const [uniqueDomains, setUniqueDomains] = useState(0);
    const [mostDominantRootDomain, setMostDominantRootDomain] = useState("n/a");

    useEffect(() => {
        fetch('http://localhost:3001/statistics')
            .then(res => res.json())
            .then(data => {
                setIndexedPages(data.indexedPages);
                setUniqueDomains(data.uniqueDomains);
                setMostDominantRootDomain(data.mostDominantRootDomain);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <div className='search'>
            <Navbar />
            <h1>Statistics</h1>
            <div className='boxes'>
                <div className='box'>
                    <h2>Indexed Pages</h2>
                    <p>{indexedPages}</p>
                </div>
                <div className='box'>
                    <h2>Unique root domains indexed</h2>
                    <p>{uniqueDomains}</p>
                </div>
                <div className='box'>
                    <h2>Most dominant root domain</h2>
                    <p>{mostDominantRootDomain}</p>
                </div>
            </div>
        </div>
    )
}

export default StatisticsPage;