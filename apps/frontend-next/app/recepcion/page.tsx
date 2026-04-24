import Nav from '@/components/Nav';
import ProtectedData from '@/components/ProtectedData';
export default function Page(){return <main><Nav/><section className='card'><h2>Recepción / Service Orders</h2><ProtectedData endpoint='/api/service-orders'/></section></main>}
