import './App.css';
import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

//Firebaseと繋げる
const firebaseConfig = {
  apiKey: "AIzaSyCRkRjR_YXPBynzlsHgWRassW0EAVVurBk",
  authDomain: "cloudcounter-cf166.firebaseapp.com",
  projectId: "cloudcounter-cf166",
  storageBucket: "cloudcounter-cf166.appspot.com",
  messagingSenderId: "780640318235",
  appId: "1:780640318235:web:e026382c306005cdba99be"
};

//定義
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const UserSettings = ({ setShowSettings, userId, name, setName }) => {
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState({ prefecture: "", city: "", other: "" });
  const [comment, setComment] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "users", userId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setName(data.name || "");
        setGender(data.gender || "");
        setBirthDate(data.birthDate || "");
        setAddress(data.address || { prefecture: "", city: "", other: "" });
        setComment(data.comment || "");
        setUsagePurpose(data.usagePurpose || "");
      }
    };
    fetchData();
  }, [userId, setName]);

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = true;
    if (!gender) newErrors.gender = true;
    if (!birthDate) newErrors.birthDate = true;
    if (!address.prefecture) newErrors.prefecture = true;
    if (!address.city) newErrors.city = true;
    if (!comment) newErrors.comment = true;
    if (!usagePurpose) newErrors.usagePurpose = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validate()) {
      const docRef = doc(db, "users", userId);
      await setDoc(docRef, {
        name,
        gender,
        birthDate,
        address,
        comment,
        usagePurpose: parseInt(usagePurpose)
      }, { merge: true });
      alert("設定を保存しました。");
      setShowSettings(false);
    } else {
      alert("全ての必須事項を入力してください。");
    }
  };

  const handleDiscard = () => {
    if (window.confirm("変更を破棄しますか？")) {
      alert("設定を破棄しました。");
      setShowSettings(false);
    }
  };

  //設定画面
  return (
    <div className="user-settings">
      <h2>ユーザー情報設定</h2>
      <label style={{ color: errors.name ? 'red' : 'black' }}>
        名前: <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label><br /><br />
      <label style={{ color: errors.gender ? 'red' : 'black' }}>
        性別:
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">選択してください</option>
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </label><br /><br />
      <label style={{ color: errors.birthDate ? 'red' : 'black' }}>
        生年月日: <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </label><br /><br />
      <label style={{ color: errors.usagePurpose ? 'red' : 'black' }}>
        ユーザーの使用目的:
        <select value={usagePurpose} onChange={(e) => setUsagePurpose(e.target.value)}>
          <option value="">選択してください</option>
          <option value="1">支援者</option>
          <option value="2">受給者</option>
        </select>
      </label><br /><br />
      <label style={{ color: errors.prefecture ? 'red' : 'black' }}>
        住所:
        <input
          type="text"
          placeholder="都道府県"
          value={address.prefecture}
          onChange={(e) => setAddress({ ...address, prefecture: e.target.value })}
        />
        <input
          type="text"
          value={address.city}
          placeholder="市町村"
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          style={{ color: errors.city ? 'red' : 'black' }}
        />
        <input
          type="text"
          value={address.other}
          placeholder="その他（マンション名など）"
          onChange={(e) => setAddress({ ...address, other: e.target.value })}
        />
      </label><br /><br />
      <label style={{ color: errors.comment ? 'red' : 'black' }}>
        コメント:<br />
        <textarea
          style={{ width: '50%', height: '3em' }}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
      </label><br /><br />
      <button onClick={() => setShowSettings(false)}>戻る</button>
      <button onClick={handleDiscard}>変更破棄</button>
      <button onClick={handleSave}>保存</button>
    </div>
  );
};

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setName(userDoc.data().name || "");
          setUsagePurpose(userDoc.data().usagePurpose || "");
        } else {
          setName("");
          setUsagePurpose("");
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setName("");
        setUsagePurpose("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign-out", error);
    }
  };

  const getUsagePurposeText = (purpose) => {
    switch (purpose) {
      case 1:
        return "支援者";
      case 2:
        return "受給者";
      default:
        return "";
    }
  };

  //ログイン画面
  return (
    <div className="App" id="app">
      <h1>貸し借りアプリ</h1>
      {!isLoggedIn ? (
        <button onClick={handleLogin}>Googleアカウントでログイン</button>
      ) : (
        <>
          <p>ログイン中: {name}</p>
          {/* <p>タイプ: {getUsagePurposeText(usagePurpose)}</p> */}
          <button onClick={handleLogout}>ログアウト</button>
          <button onClick={() => setShowSettings(true)}>ユーザー設定の変更</button>
          {showSettings && userId && <UserSettings setShowSettings={setShowSettings} userId={userId} name={name} setName={setName} />}
        </>
      )}
    </div>
  );
};

export default App;

// const firebaseConfig = {
//   apiKey: "AIzaSyCRkRjR_YXPBynzlsHgWRassW0EAVVurBk",
//   authDomain: "cloudcounter-cf166.firebaseapp.com",
//   projectId: "cloudcounter-cf166",
//   storageBucket: "cloudcounter-cf166.appspot.com",
//   messagingSenderId: "780640318235",
//   appId: "1:780640318235:web:e026382c306005cdba99be"
// };
