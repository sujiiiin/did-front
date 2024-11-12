import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import kakaoLoginImage from './kakao_login_large_wide.png';

const SocialKakao = () => {
  const [userAddress, setUserAddress] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authCode, setAuthCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [kakaoToken, setKakaoToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const Rest_api_key = process.env.REACT_APP_KAKAO_REST_API_KEY;
  const redirect_uri = process.env.REACT_APP_REDIRECT_URI;
  const serviceAdminKey = process.env.REACT_APP_SERVICE_APP_ADMIN_KEY;

  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${Rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`;

  const handleKakaoLogin = () => {
    window.location.href = kakaoURL;
  };

  const handleKakaoLogout = async () => {
    if (kakaoToken) {
      try {
        const response = await fetch('https://kapi.kakao.com/v1/user/unlink', {
          method: 'POST',
          headers: {
            'Authorization': `KakaoAK ${serviceAdminKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (response.ok) {
          console.log('카카오 로그아웃 성공');
          setKakaoToken(null); // 토큰 초기화
          setIsAuthenticated(false); // 인증 상태 초기화
          setUserAddress(''); // DID 주소 초기화
          localStorage.removeItem('vcJwt'); // 로컬 스토리지에서 vcJwt 제거
          localStorage.removeItem('username'); // 로컬 스토리지에서 username 제거
        } else {
          console.error('카카오 로그아웃 실패:', response.statusText);
          setErrorMessage('카카오 로그아웃 중 문제가 발생했습니다.');
        }
      } catch (error) {
        console.error('카카오 로그아웃 중 오류 발생:', error);
        setErrorMessage('카카오 로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  // (기존 코드 이하 생략...)

  return (
    <div className="container">
      <h1>캐치! 보안핑</h1>
  
      {/* 카카오 로그인 */}
      <img
        src={kakaoLoginImage}
        alt="카카오 로그인"
        onClick={handleKakaoLogin}
        className="kakao-login-image"
        style={{ cursor: 'pointer' }}
      />
  
      {/* MetaMask DID 인증 버튼은 카카오 토큰이 있을 때만 표시 */}
      {kakaoToken && !isAuthenticated && (
        <button onClick={authenticateWithDID}>MetaMask로 DID 인증</button>
      )}
  
      {/* 인증된 DID 주소 표시 */}
      {isAuthenticated && <p>인증된 DID 주소: {userAddress}</p>}

      {/* 카카오 로그아웃 버튼 */}
      {kakaoToken && (
        <button onClick={handleKakaoLogout}>카카오 로그아웃</button>
      )}
  
      {/* 로딩 상태 표시 */}
      {isLoading && <p>vcJwt를 가져오는 중입니다...</p>}
  
      {/* 에러 메시지 표시 */}
      {errorMessage && <p style={{ color: 'red' }}>에러: {errorMessage}</p>}
    </div>
  );
};

export default SocialKakao;
