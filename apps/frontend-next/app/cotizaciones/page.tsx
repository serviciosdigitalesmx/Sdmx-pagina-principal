import Nav from '@/components/Nav';
import ProtectedData from '@/components/ProtectedData';
export default function Page(){return <main><Nav/><section className='card'><h2>Cotizaciones</h2><ProtectedData endpoint='/api/quotes'/></section></main>}
