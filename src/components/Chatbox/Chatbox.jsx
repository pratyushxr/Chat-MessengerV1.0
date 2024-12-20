import React, { useContext, useEffect, useState } from 'react';
import './Chatbox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';

const Chatbox = () => {
  const { userData, messagesId, chatUser, messages, setMessages,chatVisible,setChatVisible } = useContext(AppContext);
  const [input, setInput] = useState('');

 // Upload file function for image uploads
 const upload = async (file) => {
  try {
    const storage = getStorage(); // Initialize Firebase Storage
    const storageRef = ref(storage, `images/${file.name}_${Date.now()}`); // Unique path for the image

    const uploadTask = await uploadBytesResumable(storageRef, file); // Upload file to Firebase Storage

    // Get the download URL after the upload is complete
    const downloadURL = await getDownloadURL(uploadTask.ref);
    return downloadURL; // Return the URL for further use
  } catch (error) {
    console.error('File upload failed:', error);
    throw error; // Rethrow to handle it in the calling function
  }
};

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        // Update the message document in the "messages" collection
        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date()
          })
        });

        // Update chat data for both users
        const userIds = [chatUser.rId, userData.id];
        userIds.forEach(async (id) => {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);

            if (chatIndex !== -1) {
              userChatData.chatsData[chatIndex].lastMessage = input.slice(0, 30);
              userChatData.chatsData[chatIndex].updatedAt = Date.now(); // Corrected field name

              // Mark the message as unseen if the recipient is the chat user
              if (userChatData.chatsData[chatIndex].rId === userData.id) {
                userChatData.chatsData[chatIndex].messageSeen = false;
              }

              // Update the user's chat data in Firestore
              await updateDoc(userChatsRef, {
                chatsData: userChatData.chatsData
              });
            }
          }
        });

       
      }
    } catch (error) {
      // Display an error message if something goes wrong
      toast.error(error.message);
      console.error('Error sending message:', error);
    }
     // Clear the input field after sending the message
     setInput("");
  };

const sendImage = async (e) => {
  try {
    

    const fileUrl = await upload(e.target.files[0]);
    if (fileUrl && messagesId) {
      await updateDoc(doc(db, 'messages', messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          image: fileUrl,
          createdAt: new Date()
        })
      });
      const userIds = [chatUser.rId, userData.id];
      userIds.forEach(async (id) => {
        const userChatsRef = doc(db, 'chats', id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatData = userChatsSnapshot.data();
          const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === messagesId);

          if (chatIndex !== -1) {
            userChatData.chatsData[chatIndex].lastMessage = "Image";
            userChatData.chatsData[chatIndex].updatedAt = Date.now(); // Corrected field name

            // Mark the message as unseen if the recipient is the chat user
            if (userChatData.chatsData[chatIndex].rId === userData.id) {
              userChatData.chatsData[chatIndex].messageSeen = false;
            }

            // Update the user's chat data in Firestore
            await updateDoc(userChatsRef, {
              chatsData: userChatData.chatsData
            });
          }
        }
      });


    }



  } catch (error) {
    toast.error(error.message)
  }
}


  const convertTimestamp = (timestamp) => {
     let date = timestamp.toDate();
     const hour = date.getHours();
     const minute = date.getMinutes();
     if (hour>12) {
      return hour-12 + ":" + minute + "PM"
      
     }
     else
     {
      return hour + ":" + minute + "AM"
     }
  }

  // Fetch and listen to message changes from Firestore
  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
        setMessages(res.data().messages.reverse());
        
      });

      // Clean up the snapshot listener on component unmount
      return () => {
        unSub();
      };
    }
  }, [messagesId, setMessages]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible?"":"hidden"}`}>
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>
          {chatUser.userData.name} <img className="dot" src={assets.green_dot} alt="" />
        </p>
        <img src={assets.help_icon} className="help" alt="" />
        <img onClick={()=>setChatVisible(false)} src={assets.arrow_icon} className='arrow'  alt="" />
      </div>

      <div className="chat-msg">
        {messages.map((msg,index)=>(
             
             <div key={index} className={msg.sId === userData.id ? "sender-msg" : "reciever-msg"}>
             {msg["image"]
             ? <img className='msg-img' src={msg.image} alt="" />
             : <p className="msg">{msg.text}</p>
            }
             
             <div>
               <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
               <p>{convertTimestamp(msg.createdAt)}</p>
             </div>
           </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Send message"
        />
        <input onChange={sendImage} type="file" id="image" accept="image/png,image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="" />
      </div>
    </div>
  ) : (
    <div className="chat-welcome">
      <img src={assets.chatnest} alt="" />
      <p>Chat Anytime, Anywhere</p>
    </div>
  );
};

export default Chatbox;
