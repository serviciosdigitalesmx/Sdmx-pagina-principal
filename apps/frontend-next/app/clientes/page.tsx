import Nav from '@/components/Nav';
import ProtectedData from '@/components/ProtectedData';
export default function Page(){return <main><Nav/><section className='card'><h2>Clientes</h2><ProtectedData endpoint='/api/customers'/></section></main>}
