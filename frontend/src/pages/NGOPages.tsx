import { useEffect, useState } from 'react';
import { apiClient, extractErrorMessage } from '../api/client';
type Profile = { organizationName:string; maximumCapacity:number; capacityUnit:string; location:string; verificationStatus:string };
type NGO = { userId:number; fullName:string; email:string; isActive:boolean; profile:Profile|null };
const empty:Profile={organizationName:'',maximumCapacity:1,capacityUnit:'kg',location:'',verificationStatus:'Not submitted'};
const field='block w-full border rounded-lg p-2';
export function NGOProfilePage(){
 const [p,setP]=useState<Profile>(empty); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(true);
 async function load(){setBusy(true);try{const r=await apiClient.get<Profile|null>('/api/ngo/me');setP(r.data||empty);}catch(e){setMessage(extractErrorMessage(e));}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 return <section className="max-w-xl space-y-4"><h1 className="text-2xl font-bold">NGO verification</h1><p>Status: <strong>{p.verificationStatus}</strong></p><p>Administrator approval is required for rescue operations.</p><p role="status">{message}</p><button onClick={()=>void load()}>Refresh status</button><form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await apiClient.put('/api/ngo/me',p);setMessage('Submitted for review.');await load();}catch(e){setMessage(extractErrorMessage(e));}finally{setBusy(false);}}}>
 <fieldset disabled={busy||p.verificationStatus==='Approved'} className="space-y-3">
 <label>Organization<input className={field} required maxLength={200} value={p.organizationName} onChange={e=>setP({...p,organizationName:e.target.value})}/></label>
 <label>Capacity<input className={field} type="number" min="0.01" max="99999999.99" step="0.01" required value={p.maximumCapacity} onChange={e=>setP({...p,maximumCapacity:Number(e.target.value)})}/></label>
 <label>Unit<input className={field} required maxLength={20} value={p.capacityUnit} onChange={e=>setP({...p,capacityUnit:e.target.value})}/></label>
 <label>Location<input className={field} required maxLength={500} value={p.location} onChange={e=>setP({...p,location:e.target.value})}/></label>
 <button className="bg-emerald-700 text-white rounded p-2" type="submit">Submit for review</button></fieldset></form></section>;
}
export function ManageNGOsPage(){
 const [rows,setRows]=useState<NGO[]>([]);const [message,setMessage]=useState('');const [busy,setBusy]=useState(true);
 async function load(){setBusy(true);try{setRows((await apiClient.get<NGO[]>('/api/ngo/admin')).data);}catch(e){setMessage(extractErrorMessage(e));}finally{setBusy(false);}}
 useEffect(()=>{void load();},[]);
 async function review(id:number,status:string){if(!window.confirm(`${status} this NGO?`))return;setBusy(true);try{await apiClient.patch(`/api/ngo/admin/${id}`,{status});setMessage('Review saved.');await load();}catch(e){setMessage(extractErrorMessage(e));}finally{setBusy(false);}}
 return <section className="space-y-4"><h1 className="text-2xl font-bold">Manage NGOs</h1><p role="status">{message}</p><p>{busy?'Loading…':`${rows.length} NGO accounts`}</p><button onClick={()=>void load()}>Refresh</button>{rows.map(n=><article key={n.userId} className="border rounded-xl p-4 space-y-2"><h2 className="font-bold">{n.profile?.organizationName||n.fullName}</h2><p>{n.email} · {n.isActive?'Active':'Inactive'}</p><p>{n.profile?.verificationStatus||'Profile missing'}</p>{n.profile&&<><p>{n.profile.maximumCapacity} {n.profile.capacityUnit} · {n.profile.location}</p><div className="flex gap-2"><button disabled={busy||!n.isActive||n.profile.verificationStatus==='Approved'} className="bg-emerald-700 text-white p-2 rounded disabled:opacity-40" onClick={()=>void review(n.userId,'Approved')}>Approve</button><button disabled={busy||n.profile.verificationStatus==='Rejected'} className="bg-rose-700 text-white p-2 rounded disabled:opacity-40" onClick={()=>void review(n.userId,'Rejected')}>Reject</button></div></>}</article>)}</section>;
}
