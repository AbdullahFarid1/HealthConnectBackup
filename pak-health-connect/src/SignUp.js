import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  
  // Doctor specific fields
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState(''); // e.g., "Lahore", "Karachi"

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Authentication User in Google Cloud
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Prepare Data based on Role
      let userData = {
        uid: user.uid,
        name: name,
        age: age,
        role: role, // Important: Store their role
        email: email,
        createdAt: new Date()
      };

      if (role === 'doctor') {
        userData = { ...userData, specialization, location };
      }

      // 3. Store in Firestore Database (Google Cloud)
      // We store them in separate collections: 'doctors' or 'patients'
      const collectionName = role === 'doctor' ? 'doctors' : 'patients';
      
      await setDoc(doc(db, collectionName, user.uid), userData);

      alert(`Success! Welcome ${role} ${name}`);
      navigate(role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');

    } catch (error) {
      console.error("Error signing up:", error);
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Join Pak Health Connect</h2>
      
      {/* Role Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          style={{ marginRight: '10px', fontWeight: role === 'patient' ? 'bold' : 'normal' }} 
          onClick={() => setRole('patient')}>
          I am a Patient
        </button>
        <button 
          style={{ fontWeight: role === 'doctor' ? 'bold' : 'normal' }} 
          onClick={() => setRole('doctor')}>
          I am a Doctor
        </button>
      </div>

      <form onSubmit={handleSignUp}>
        <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)} required block />
        <input type="number" placeholder="Age" onChange={(e) => setAge(e.target.value)} required block />
        
        {/* Conditional Rendering for Doctors */}
        {role === 'doctor' && (
          <>
            <input type="text" placeholder="Specialization (e.g. Dentist, Cardiologist)" onChange={(e) => setSpecialization(e.target.value)} required />
            <input type="text" placeholder="Clinic Location (e.g. Blue Area, Islamabad)" onChange={(e) => setLocation(e.target.value)} required />
          </>
        )}

        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        
        <button type="submit" style={{ marginTop: '20px', width: '100%' }}>Sign Up as {role}</button>
      </form>
    </div>
  );
};

export default SignUp;
