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
          setKakaoToken(tokenData.access_token);
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

        if (kakaoToken) {
          sendAuthDataToBackend(address, kakaoToken); // DID 주소와 토큰을 함께 전송
        }
      } catch (error) {
        console.error("DID 인증 실패:", error);
        alert('DID 인증 실패');
      }
    } else {
      alert('MetaMask가 설치되어 있지 않습니다. MetaMask 설치 페이지로 이동합니다.');
      window.location.href = 'https://metamask.io/download.html';
    }
  };

  const sendAuthDataToBackend = async (userDid, userToken) => {
    setIsLoading(true); // 로딩 상태 시작
    try {
      const response = await fetch('https://www.mongoljune.shop/issue-vc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDid: userDid,
          userToken: userToken,
        }),
      });

      const data = await response.json();
      console.log('백엔드 응답 데이터:', data);

      if (data.vcJwt) {
        console.log('DID 주소와 토큰이 성공적으로 백엔드로 전송되었습니다.');
        
        // vcJwt를 Local Storage에 저장
        localStorage.setItem('vcJwt', data.vcJwt);

        // vcJwt 검증 함수 호출
        verifyVcJwt(data.vcJwt);
      } else {
        console.error('백엔드 처리 실패:', data.message || '알 수 없는 오류');
      }
    } catch (error) {
      console.error('백엔드 서버 전송 중 오류:', error);
    } finally {
      setIsLoading(false); // 로딩 상태 종료
    }
  };

  const verifyVcJwt = async (vcJwt) => {
    try {
      const response = await fetch('https://www.mongoljune.shop/verify-vc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vcJwt: vcJwt }),
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log("vcJwt 검증 성공");

        // username을 Local Storage에 저장
        localStorage.setItem('username', data.username);

        // 새로운 페이지로 리다이렉트
        window.location.href = "/username.html";
      } else if (response.status === 500) {
        console.error("vcJwt 검증 실패: 다시 로그인해야 합니다.");
        
        // Local Storage 값 제거
        localStorage.removeItem('vcJwt');
        localStorage.removeItem('username');
        
        // 페이지 새로 고침하여 처음부터 다시 시작
        window.location.reload();
      } else {
        console.error("예상치 못한 오류 발생");
        setErrorMessage("알 수 없는 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("vcJwt 검증 중 오류 발생:", error);
      setErrorMessage("vcJwt 검증 중 오류가 발생했습니다.");
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
    <div className="outer-container">
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
    
        {/* 로딩 상태 표시 */}
        {isLoading && <p>vcJwt를 가져오는 중입니다...</p>}
    
        {/* 에러 메시지 표시 */}
        {errorMessage && <p style={{ color: 'red' }}>에러: {errorMessage}</p>}
      </div>
    </div>
  );
};

export default SocialKakao;
