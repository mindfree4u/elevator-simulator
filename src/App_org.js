import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Building, XCircle, ArrowDown, ArrowUp, Loader } from 'lucide-react';
import './App.css';

export default function App() {
  // State for the actual integer floor the elevator is currently at
  const [currentFloor, setCurrentFloor] = useState(0); // Start at 0층
  // State for the visual position of the elevator (can be fractional for smooth animation)
  const [elevatorPosition, setElevatorPosition] = useState(0); // Start at 0층
  // State for the target floor the elevator is moving to
  const [targetFloor, setTargetFloor] = useState(null);
  // State to indicate if the elevator is currently moving
  const [isMoving, setIsMoving] = useState(false);
  // State to indicate if the elevator doors are currently opening/closing
  const [isDoorAnimating, setIsDoorAnimating] = useState(false);
  // State for the message displayed to the user
  const [message, setMessage] = useState('엘리베이터 대기 중');
  // State for the queue of floors to visit
  const [callQueue, setCallQueue] = useState([]);
  // Ref for the interval timer to clear it when component unmounts or movement stops
  const moveIntervalRef = useRef(null);
  // Ref for the door animation timer
  const doorTimerRef = useRef(null);
  
  // Building configuration
  const totalFloors = 21; // B1(0), 1F, 2F, ..., 19F, 20F
  const minFloor = 0; // B1 floor (0층)
  const maxFloor = 20; // 20F
  const homeFloor = 6; // 6F is home
  
  // Animation settings
  const floorMoveTime = 2000; // 2 seconds per floor
  const animationInterval = 50; // 50ms for smooth animation
  const doorAnimationTime = 3000; // 3 seconds

  // Helper function to get floor display name
  const getFloorDisplay = (floor) => {
    if (floor === 0) return 'B1';
    return `${floor}층`;
  };

  // Function to handle elevator calls
  const callElevator = useCallback((floor) => {
    if (floor < minFloor || floor > maxFloor) {
      setMessage('유효하지 않은 층입니다.');
      return;
    }
    
    if (callQueue.includes(floor) || (floor === currentFloor && !isMoving && !isDoorAnimating)) {
      setMessage(`${getFloorDisplay(floor)}은 이미 호출 대기 중이거나 현재 층입니다.`);
      return;
    }
    
    if (isDoorAnimating || isMoving) {
      setMessage('엘리베이터가 이동 중이거나 문이 열리고/닫히는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setCallQueue(prevQueue => {
      const newQueue = [...prevQueue, floor];
      if (floor > currentFloor) {
        return newQueue.sort((a, b) => a - b);
      } else {
        return newQueue.sort((a, b) => b - a);
      }
    });

    setMessage(`${getFloorDisplay(floor)} 호출 대기 중...`);
  }, [callQueue, currentFloor, minFloor, maxFloor, isDoorAnimating, isMoving]);

  // Function to cancel the current elevator call
  const cancelCall = useCallback(() => {
    if (doorTimerRef.current) {
      clearTimeout(doorTimerRef.current);
      doorTimerRef.current = null;
    }
    // 현재 위치가 소수점(층 사이)일 때, 진행 방향에 따라 다음 층까지 정상 운행 후 멈춤
    let nextStop = Math.round(elevatorPosition);
    if (isMoving && targetFloor !== null && elevatorPosition !== Math.round(elevatorPosition)) {
      if (targetFloor > currentFloor && nextStop < maxFloor) {
        nextStop = Math.ceil(elevatorPosition); // 위로 이동 중이면 올림
      } else if (targetFloor < currentFloor && nextStop > minFloor) {
        nextStop = Math.floor(elevatorPosition); // 아래로 이동 중이면 내림
      }
    }
    if (isMoving && nextStop !== Math.round(elevatorPosition)) {
      setIsMoving(true);
      setMessage(`${getFloorDisplay(nextStop)}에서 정지합니다...`);
      animateToFloor(elevatorPosition, nextStop, () => {
        setIsMoving(false);
        setTargetFloor(null);
        setIsDoorAnimating(false);
        setCallQueue([]);
        setMessage('엘리베이터 호출이 취소되었습니다.');
      });
    } else {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      setCurrentFloor(nextStop);
      setElevatorPosition(nextStop);
      setTargetFloor(null);
      setIsMoving(false);
      setIsDoorAnimating(false);
      setCallQueue([]);
      setMessage('엘리베이터 호출이 취소되었습니다.');
    }
  }, [elevatorPosition, isMoving, targetFloor, currentFloor, minFloor, maxFloor, getFloorDisplay]);

  // Function to animate elevator to a specific floor (used for cancel)
  function animateToFloor(from, to, onComplete) {
    const totalDistance = Math.abs(to - from);
    if (totalDistance === 0) {
      onComplete && onComplete();
      return;
    }
    const totalSteps = totalDistance * (floorMoveTime / animationInterval);
    const stepSize = (to - from) / totalSteps;
    let currentStep = 0;
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
    moveIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
        setElevatorPosition(to);
        setCurrentFloor(to);
        onComplete && onComplete();
      } else {
        setElevatorPosition(prev => prev + stepSize);
      }
    }, animationInterval);
  }

  // Function to start elevator movement animation
  const startMovement = useCallback((startPosition, endPosition) => {
    console.log('Starting animation from', startPosition, 'to', endPosition);
    
    const totalDistance = Math.abs(endPosition - startPosition);
    const totalSteps = totalDistance * (floorMoveTime / animationInterval);
    const stepSize = (endPosition - startPosition) / totalSteps;
    
    let currentStep = 0;
    console.log('Animation params:', { startPosition, endPosition, totalSteps, stepSize });

    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }

    moveIntervalRef.current = setInterval(() => {
      currentStep++;
      console.log('Animation step:', currentStep, 'of', totalSteps);
      
      if (currentStep >= totalSteps) {
        console.log('Animation complete, arrived at', endPosition);
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
        }
        setIsMoving(false);
        setTargetFloor(null);
        setCurrentFloor(endPosition);
        setElevatorPosition(endPosition);

        // 문 열림/닫힘 메시지를 시차를 두고 분리해서 표시
        setMessage(`${getFloorDisplay(endPosition)}에 도착했습니다. <span class="door-open">문 열림</span>`);
        setIsDoorAnimating(true);
        // 문 열림 메시지 후 일정 시간 뒤 문 닫힘 메시지 표시
        doorTimerRef.current = setTimeout(() => {
          setMessage(`${getFloorDisplay(endPosition)}에 도착했습니다. <span class="door-close">문 닫힘</span>`);
          // 문 닫힘 메시지 후 다시 대기 상태로 전환
          doorTimerRef.current = setTimeout(() => {
            setIsDoorAnimating(false);
            setCallQueue(prevQueue => prevQueue.slice(1));
            setMessage('엘리베이터 대기 중');
            console.log('Door animation complete at', endPosition);
          }, doorAnimationTime / 1.5); // 닫힘 메시지 표시 시간 (2초)
        }, doorAnimationTime / 1.5); // 열림 메시지 표시 시간 (2초)
      } else {
        const newPosition = startPosition + (stepSize * currentStep);
        console.log('New position:', newPosition);
        setElevatorPosition(newPosition);
      }
    }, animationInterval);
  }, [floorMoveTime, animationInterval, doorAnimationTime]);

  // Effect to handle elevator movement based on the call queue
  useEffect(() => {
    console.log('Effect triggered:', { isMoving, isDoorAnimating, callQueueLength: callQueue.length, currentFloor });
    
    if (!isMoving && !isDoorAnimating && callQueue.length > 0) {
      const nextFloorInQueue = callQueue[0];
      console.log('Processing next floor:', nextFloorInQueue, 'from', currentFloor);

      if (currentFloor === nextFloorInQueue) {
        console.log('Already at target floor, opening doors');
        setMessage(`${getFloorDisplay(nextFloorInQueue)}에 도착했습니다. 문 열림/닫힘...`);
        setIsDoorAnimating(true);
        doorTimerRef.current = setTimeout(() => {
          setIsDoorAnimating(false);
          setCallQueue(prevQueue => prevQueue.slice(1));
          setMessage('엘리베이터 대기 중');
          console.log('Door animation complete');
        }, doorAnimationTime);
        return;
      }

      console.log('Starting movement from', currentFloor, 'to', nextFloorInQueue);
      setTargetFloor(nextFloorInQueue);
      setIsMoving(true);
      setMessage(`엘리베이터가 ${getFloorDisplay(nextFloorInQueue)}으로 이동 중입니다.`);

      setTimeout(() => {
        startMovement(currentFloor, nextFloorInQueue);
      }, 10);
    } else if (!isMoving && !isDoorAnimating && callQueue.length === 0 && targetFloor === null) {
      setMessage('엘리베이터 대기 중');
    }
  }, [callQueue, isMoving, isDoorAnimating, currentFloor, targetFloor, startMovement, doorAnimationTime]);

  // Cleanup intervals and timeouts on component unmount
  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
      if (doorTimerRef.current) {
        clearTimeout(doorTimerRef.current);
      }
    };
  }, []);

  console.log('Render state:', { currentFloor, elevatorPosition, isMoving, isDoorAnimating, targetFloor });

  return (
    <>
      {/* 스타일 분리: App.css에서 import 하도록 변경 */}
      <div className="elevator-container">
        <div className="elevator-panel">
          <h1 className="elevator-title">
            <Building className="elevator-title-icon" size={32} />
            엘리베이터 제어
          </h1>

          {/* Elevator Status Display */}
          
          <div className="status-panel">
            <p className="status-label">현재 엘리베이터 위치:</p>
            <div className="current-floor-display">
              {/* 이동 중에는 elevatorPosition을 반올림하여 표시, 정지 시 currentFloor 표시 */}
              {isMoving || isDoorAnimating
                ? getFloorDisplay(Math.round(elevatorPosition))
                : getFloorDisplay(currentFloor)}
              {(isMoving || isDoorAnimating) && (
                <Loader className="loading-spinner" size={36} />
              )}
            </div>
            <p className="status-message" dangerouslySetInnerHTML={{ __html: message }}></p>
            {/* {callQueue.length > 0 && (
              <p className="queue-display">
                호출 층: {callQueue.map(floor => getFloorDisplay(floor)).join(', ')}
              </p>
            )} */}
            {/* <div className="position-display">
              위치: {getFloorDisplay(Math.round(elevatorPosition))} ({elevatorPosition.toFixed(1)})
            </div> */}
          </div>

          {/* Elevator Shaft Visualization */}
          <div className="elevator-shaft">
            {/* Floor markers */}
            {Array.from({ length: totalFloors }).map((_, index) => {
              const floorNumber = maxFloor - index; // 20, 19, 18, ..., 2, 1, 0
              return (
                <div
                  key={index}
                  className="floor-marker"
                  style={{ top: `${(index / totalFloors) * 100}%` }}
                >
                  <span className="floor-label">
                    {getFloorDisplay(floorNumber)}
                  </span>
                </div>
              );
            })}
            {/* Elevator Car */}
            <div
              className="elevator-car"
              style={{
                height: `${100 / totalFloors}%`,
                top: `${((maxFloor - elevatorPosition) / totalFloors) * 100}%`,
              }}
            >
              <ArrowUp 
                size={16} 
                className={`direction-arrow ${isMoving && targetFloor !== null && targetFloor > currentFloor ? "up" : "hidden"}`} 
              />
              <ArrowDown 
                size={16} 
                className={`direction-arrow ${isMoving && targetFloor !== null && targetFloor < currentFloor ? "down" : "hidden"}`} 
              />
              {!isMoving && !isDoorAnimating && (
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {getFloorDisplay(currentFloor)}
                </div>
              )}
              {isDoorAnimating && (
                <div className="door-animation">
                  <div className="door-dot"></div>
                  <div className="door-dot"></div>
                  <div className="door-dot"></div>
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="control-buttons">
            <button
              onClick={() => callElevator(homeFloor)}
              className="control-button home"
              disabled={isMoving || isDoorAnimating || (targetFloor === homeFloor && callQueue.includes(homeFloor))}
            >
              <Home className="button-icon" size={20} />
              집 ({getFloorDisplay(homeFloor)})
            </button>
            <button
              onClick={() => callElevator(0)}
              className="control-button lobby"
              disabled={isMoving || isDoorAnimating || (targetFloor === 0 && callQueue.includes(0))}
            >
              <Building className="button-icon" size={20} />
              로비 ({getFloorDisplay(0)})
            </button>
          </div>

          <div className="cancel-button-container">
            <button
              onClick={cancelCall}
              className="control-button cancel"
              disabled={(!isMoving && callQueue.length === 0 && !isDoorAnimating)}
            >
              <XCircle className="button-icon" size={20} />
              호출 취소
            </button>
          </div>

          {/* Floor Selection Buttons */}
          <div className="floor-selection">
            <h2 className="floor-selection-title">다른 층 호출</h2>
            <div className="floor-buttons-grid">
              {Array.from({ length: totalFloors }).map((_, index) => {
                const floorNumber = maxFloor - index; // 20, 19, 18, ..., 2, 1, 0
                return (
                  <button
                    key={index}
                    onClick={() => callElevator(floorNumber)}
                    className={`floor-button ${
                      currentFloor === floorNumber && !isMoving && !isDoorAnimating
                        ? 'current'
                        : callQueue.includes(floorNumber)
                          ? 'queued'
                          : 'default'
                    } ${
                      (isMoving && targetFloor === floorNumber) || (isDoorAnimating && currentFloor === floorNumber) 
                        ? 'animating' 
                        : ''
                    }`}
                    disabled={isMoving || isDoorAnimating || callQueue.includes(floorNumber)}
                  >
                    {getFloorDisplay(floorNumber)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}