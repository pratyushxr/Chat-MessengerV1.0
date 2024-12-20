import React, { useState } from 'react'; // Correct import for useState
import './Login.css';
import assets from '../../assets/assets';
import { signup, login } from '../../config/firebase';

const Login = () =>  { 

  const [currState, setCurrState] = useState("Sign Up"); // Correct hook
 const [username,setUsername] = useState("");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");



const onSubmitHandler = (event) => {
 event.preventDefault();
 if (currState=== "Sign Up") {
  signup(username,email,password)
 }
 else{
  login(email,password)
 }
}


  return (
    <div className='login'>
      <div className="logo-container">
        <img src={assets.chatnest} alt="" className='logo' />
        <h2 className='logo-text'>ChatNest</h2>
      </div>
      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2> 

        {currState === "Sign Up"?<input onChange={(e)=>setUsername(e.target.value)} value={username}  type="text" placeholder='username' className="form-input" required/>:null}
        <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" placeholder='Email Address' className="form-input" />
        <input onChange={(e)=>setPassword(e.target.value)} value={password} type="password" placeholder='Password' className="form-input" />

        <button type='submit'>{currState === "Sign Up"?"Create Account":"Login Now"}</button>

        <div className="login-term">
          <input type="checkbox" className="checkbox" />
          <p>Agree terms and conditions</p>
        </div>
        
        <div className="login-forget"></div>
        {
          currState === "Sign Up"
   ? <p className='login-toggle'>
   Already have an account? <span onClick={()=>setCurrState("Login")}>Login Here</span>
 </p>: <p className='login-toggle'>
         Create an account <span onClick={()=>setCurrState("Sign Up")}>click here</span>
        </p>
        }
       
       
      </form>
    </div>
  );
};

export default Login;
