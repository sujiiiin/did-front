import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import kakaoLoginImage from './kakao_login_large_wide.png';

const SocialKakao = () => {
  const [userAddress, setUserAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [kakaoToken, setKakaoToken] = useState(null); // 카카오 로그인 토큰 상태 추가

  // MetaMask를 통한 DID 인증
  const authenticateWithDID = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        setIsAuthenticated(true);
        alert(`DID 인증 성공: ${address}`);
        sendDIDToBackend(address); // 인증된 DID 주소를 백엔드로 전송
      } catch (error) {
        console.error("DID 인증 실패:", error);
        alert('DID 인증 실패');
      }
    } else {
      alert('MetaMask가 설치되어 있지 않습니다. MetaMask 설치 페이지로 이동합니다.');
      window.location.href = 'https://metamask.io/download.html';
    }
  };

  // 인증된 DID 주소를 백엔드로 전송
  const sendDIDToBackend = async (address) => {
    try {
      const response = await fetch('http://localhost:4000/api/did', { // 백엔드 URL 설정
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          didAddress: address, // DID 주소를 전송
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('DID 주소가 성공적으로 백엔드로 전송되었습니다.');
      } else {
        console.error('백엔드 DID 주소 처리 실패:', data.message);
      }
    } catch (error) {
      console.error('백엔드 서버 전송 중 오류:', error);
    }
  };

  // 카카오 로그인
  const Rest_api_key = process.env.REACT_APP_KAKAO_REST_API_KEY; 
  const redirect_uri = process.env.REACT_APP_REDIRECT_URI;
  
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${Rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`;

  const handleKakaoLogin = () => {
    window.location.href = kakaoURL;
  };

  const extractAuthCode = () => {
    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      setAuthCode(code);
      console.log('인가 코드 추출 성공:', code);
    } else {
      console.log('인가 코드가 없습니다.');
    }
  };

  const requestKakaoToken = async () => {
    if (authCode) {
      try {
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: Rest_api_key,
            redirect_uri: redirect_uri,
            code: authCode,
          }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.access_token) {
          console.log("로그인 토큰 발급 성공");
          setKakaoToken(tokenData.access_token); // 발급된 토큰을 상태에 저장하여 화면에 표시
          sendTokenToBackend(tokenData.access_token);
        } else {
          setErrorMessage(`토큰 발급 실패: ${JSON.stringify(tokenData)}`);
          console.error("로그인 토큰 발급 실패:", tokenData);
        }
      } catch (error) {
        console.error("토큰 발급 중 오류 발생:", error);
        setErrorMessage('토큰 발급 중 오류가 발생했습니다.');
      }
    }
  };

  const sendTokenToBackend = async (token) => {
    try {
      const response = await fetch('http://localhost:4000/api/kakao/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('토큰이 성공적으로 백엔드로 전송되었습니다.');
      } else {
        console.error('백엔드 토큰 처리 실패:', data.message);
      }
    } catch (error) {
      console.error('백엔드 서버 전송 중 오류:', error);
    }
  };

  useEffect(() => {
    extractAuthCode();
  }, []);

  useEffect(() => {
    if (authCode) {
      requestKakaoToken();
    }
  }, [authCode]);

  return (
    <div className="container">
      <h1>MetaMask DID 인증 및 카카오 로그인</h1>

      {/* MetaMask DID 인증 */}
      {!isAuthenticated ? (
        <button onClick={authenticateWithDID}>MetaMask로 DID 인증</button>
      ) : (
        <p>인증된 DID 주소: {userAddress}</p>
      )}

      {/* 카카오 로그인 */}
      <img
        src={kakaoLoginImage}
        alt="카카오 로그인"
        onClick={handleKakaoLogin}
        style={{ cursor: 'pointer', width: '300px' }}
      />

      {/* 발급된 카카오 로그인 토큰 표시 */}
      {kakaoToken && (
        <p>카카오 로그인 토큰: {kakaoToken}</p>
      )}

      {/* 에러 메시지 표시 */}
      {errorMessage && <p style={{color: 'red'}}>에러: {errorMessage}</p>}
    </div>
  );
};

export default SocialKakao;
