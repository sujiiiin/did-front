import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css'; // 스타일 시트 추가
import kakaoLoginImage from './kakao_login_large_wide.png'; // 이미지 경로 설정

const SocialKakao = () => {
  const [userAddress, setUserAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState(null); // 인가 코드 저장
  const [errorMessage, setErrorMessage] = useState(null); // 에러 메시지 저장

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
      } catch (error) {
        console.error("DID 인증 실패:", error);
        alert('DID 인증 실패');
      }
    } else {
      // MetaMask가 설치되어 있지 않으면 설치 페이지로 이동
      alert('MetaMask가 설치되어 있지 않습니다. 설치 페이지로 이동합니다.');
      window.location.href = 'https://metamask.io/download.html';
    }
  };

  // 카카오 로그인
  const Rest_api_key = process.env.REACT_APP_KAKAO_REST_API_KEY; 
  const redirect_uri = process.env.REACT_APP_REDIRECT_URI;
  
  // 카카오 OAuth 요청 URL
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${Rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`;

  const handleKakaoLogin = () => {
    // 카카오 로그인 페이지로 리다이렉트
    window.location.href = kakaoURL;
  };

  // 인가 코드 추출
  const extractAuthCode = () => {
    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      setAuthCode(code); // 인가 코드 저장
      console.log('인가 코드 추출 성공:', code);
    } else {
      console.log('인가 코드가 없습니다.');
    }
  };

  // 로그인 토큰 발급
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
            client_id: Rest_api_key, // REST API 키
            redirect_uri: redirect_uri, // 설정된 Redirect URL
            code: authCode, // 인가 코드
          }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.access_token) {
          console.log("로그인 토큰 발급 성공");

          // 로그인 토큰을 백엔드로 전송
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

  // 백엔드로 토큰 전송
  const sendTokenToBackend = async (token) => {
    try {
      const response = await fetch('http://localhost:4000/api/kakao/token', { // 백엔드 URL 설정
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token, // 로그인 토큰을 전송
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

  // 컴포넌트가 로드될 때 인가 코드 추출
  useEffect(() => {
    extractAuthCode();
  }, []);

  // 인가 코드가 변경되면 로그인 토큰 요청
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

      {/* 에러 메시지 표시 */}
      {errorMessage && <p style={{color: 'red'}}>에러: {errorMessage}</p>}
    </div>
  );
};

export default SocialKakao;
