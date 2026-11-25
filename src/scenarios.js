// 상담 화면, 예시 데이터 및 실행에 사용되는 화면 전이.
window.SKIX_SCENARIOS = [
  {
    "no": 1,
    "title": "정보변경_결제정보(출금유형/이체일) 문의",
    "displayTitle": "결제정보 문의",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "결제정보 문의 인입",
    "keywords": [
      "결제일",
      "납부일",
      "출금일",
      "이체일",
      "결제정보 조회",
      "결제수단 조회",
      "자동납부일",
      "당월 납부 결과",
      "언제 결제",
      "언제 출금",
      "결제일이 언제",
      "돈 나가는 날",
      "언제 돈 나가",
      "결제수단 확인",
      "등록 카드 확인",
      "등록된 카드",
      "납부 계좌 확인",
      "출금되는 계좌",
      "자동납부 확인",
      "청구일"
    ],
    "intentRules": [
      [
        [
          "결제일",
          "납부일",
          "출금일",
          "인출일",
          "이체일",
          "결제",
          "출금",
          "인출",
          "자동이체"
        ],
        [
          "며칠",
          "몇일",
          "어느 날",
          "언제",
          "날짜",
          "매월 몇"
        ]
      ],
      [
        [
          "결제 수단",
          "결제 카드",
          "출금 계좌",
          "납부 카드",
          "자동납부"
        ],
        [
          "조회",
          "확인",
          "어떤",
          "어디",
          "등록되어",
          "등록돼"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "PASS 인증이 필요한 계약자",
        "customer": "결제일이 언제인지 알고 싶어요.",
        "message": "결제정보는 계약자 본인만 확인할 수 있어요. 먼저 본인인증을 해 주세요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "e",
        "condition": "조회 계약 1~4건",
        "message": "결제정보를 확인할 계약을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택",
          "공기청정기 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "WPU-1000 · 문래동 · 예시카드"
          },
          {
            "title": "공기청정기",
            "detail": "ACL-1000 · 문래동 · 예시은행"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "g",
        "condition": "결제정보 상세 조회",
        "message": "선택하신 계약의 결제정보예요.",
        "kind": "result",
        "options": [
          "결제정보 변경",
          "위약금 문의"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "제품코드 WPU-1000\n사용 주소 서울 영등포구 문래동"
          },
          {
            "title": "결제정보",
            "detail": "출금 유형  신용카드 자동납부\n카드사  예시카드\n카드번호  ••••-••••-••••-1234\n결제일  매월 25일"
          },
          {
            "title": "계약 기간",
            "detail": "2025.06.01 ~ 2030.05.31\n의무 사용 36개월 · 전체 계약 60개월\n사용 기간 17개월"
          },
          {
            "title": "청구·납부",
            "detail": "구독료  월 29,900원\n미납금(당월 제외)  0원\n당월 납부  납부 완료"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "k",
        "condition": "당월 납부 완료",
        "message": "이번 달 요금이 납부됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "당월 납부 상태",
            "detail": "납부 완료"
          }
        ]
      },
      {
        "id": "S05",
        "stepId": "l",
        "condition": "당월 납부 미완료",
        "message": "이번 달 요금의 납부가 아직 확인되지 않았어요.",
        "kind": "result",
        "items": [
          {
            "title": "이체·결제 예정일",
            "detail": "2026년 11월 25일"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "l",
        "condition": "결제일 당일에 납부 미완료",
        "message": "오늘은 결제일이에요. 이미 납부하셨다면 아직 시스템에 반영되지 않았을 수 있어요.",
        "kind": "result"
      },
      {
        "id": "S07",
        "stepId": "n",
        "condition": "조회 계약 0건",
        "message": "확인할 수 있는 계약이 없어요. 제품 설치 전이나 설치 당일에는 계약이 조회되지 않을 수 있어요.",
        "kind": "exception"
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "PASS 인증 실패 또는 계약자 확인 불가",
        "message": "계약자 본인을 확인하지 못했어요. 본인인증을 다시 시도해 주세요.",
        "kind": "exception",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S09",
        "stepId": "h",
        "condition": "계약 5건 이상 또는 인증 재시도 소진",
        "message": "챗봇에서 조회를 계속하기 어려워요. 상담사를 통해 확인하실 수 있어요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "예"
      },
      {
        "from": "b",
        "to": "h",
        "label": "아니오"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "e",
        "label": "1~4건"
      },
      {
        "from": "d",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "d",
        "to": "h",
        "label": "5건 이상·API 실패"
      },
      {
        "from": "e",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g",
        "label": "결제정보"
      },
      {
        "from": "f",
        "to": "j",
        "label": "당월 납부 결과"
      },
      {
        "from": "j",
        "to": "k",
        "label": "완료"
      },
      {
        "from": "j",
        "to": "l",
        "label": "미완료"
      },
      {
        "from": "g",
        "to": "r"
      },
      {
        "from": "k",
        "to": "r"
      },
      {
        "from": "l",
        "to": "r"
      },
      {
        "from": "r",
        "to": "z"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 2,
    "title": "수납 단순문의_구독/멤버십료 문의",
    "displayTitle": "구독료·멤버십료 문의",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "구독·멤버십료 문의 인입",
    "keywords": [
      "구독료",
      "멤버십료",
      "렌탈 요금",
      "렌탈료",
      "월 요금 조회",
      "매달 얼마",
      "요금 문의",
      "월 얼마",
      "한 달에 얼마",
      "한달 요금",
      "매월 요금",
      "월 납부금",
      "정기 요금",
      "월 이용료",
      "한달 구독료",
      "얼마씩 나가"
    ],
    "intentRules": [
      [
        [
          "구독료",
          "멤버십료",
          "렌탈료",
          "렌탈 요금",
          "월 요금",
          "월 이용료",
          "한달 요금",
          "이용료",
          "매달",
          "매월"
        ],
        [
          "얼마",
          "얼만",
          "요금",
          "비용",
          "내나요",
          "내는지",
          "알려"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "PASS 인증이 필요한 계약자",
        "customer": "매월 내는 구독료가 얼마예요?",
        "message": "월 이용료를 확인하려면 계약자 본인인증이 필요해요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "e",
        "condition": "조회 계약 1~4건",
        "message": "자세히 확인할 계약을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "월 29,900원 · 문래동"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "당월 제외 미납금 없음",
        "message": "선택하신 계약의 월 이용료예요.",
        "kind": "result",
        "options": [
          "결제정보 변경",
          "위약금 조회"
        ],
        "items": [
          {
            "title": "월 이용료",
            "detail": "29,900원"
          },
          {
            "title": "당월 납부 상태",
            "detail": "납부 완료"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "당월 제외 미납금 있음",
        "message": "월 이용료와 지난달까지의 미납금을 확인해 주세요.",
        "kind": "result",
        "options": [
          "미납금 납부",
          "결제정보 변경",
          "위약금 조회"
        ],
        "items": [
          {
            "title": "월 이용료",
            "detail": "29,900원"
          },
          {
            "title": "미납금(당월 제외)",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "n",
        "condition": "조회 계약 0건",
        "message": "조회할 계약이 없어요. 제품 설치 전이나 설치 당일에는 계약이 조회되지 않을 수 있어요.",
        "kind": "exception"
      },
      {
        "id": "S06",
        "stepId": "h",
        "condition": "계약자 본인 확인 실패",
        "message": "계약자 본인을 확인하지 못했어요. 본인인증을 다시 시도해 주세요.",
        "kind": "exception",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "조회 계약 5건 이상",
        "message": "계약이 여러 건 확인됐어요. 상담사를 통해 월 이용료를 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "예"
      },
      {
        "from": "b",
        "to": "h",
        "label": "아니오"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "e",
        "label": "1~4건"
      },
      {
        "from": "d",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "d",
        "to": "h",
        "label": "5건 이상·API 실패"
      },
      {
        "from": "e",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k",
        "label": "후속 업무 선택"
      },
      {
        "from": "j",
        "to": "z",
        "label": "기타 문의·종료"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 3,
    "title": "정보변경_결제정보(출금유형/이체일) 변경",
    "displayTitle": "결제정보 변경",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "결제정보 조회에서 변경 선택",
    "keywords": [
      "결제수단 변경",
      "카드 변경",
      "결제 카드 변경",
      "계좌 변경",
      "출금일 변경",
      "이체일 변경",
      "자동이체 변경",
      "납부정보 변경",
      "카드 바꾸",
      "카드를 바꾸",
      "카드 교체",
      "결제수단 바꾸",
      "계좌로 변경",
      "다른 카드",
      "결제 방법 바꾸",
      "카드 재등록",
      "납부 계좌 변경",
      "결제일 바꾸",
      "출금 계좌 바꾸"
    ],
    "intentRules": [
      [
        [
          "결제일",
          "출금 날짜",
          "이체일",
          "결제 수단",
          "납부 수단",
          "자동이체",
          "등록 카드",
          "카드",
          "계좌"
        ],
        [
          "바꾸",
          "바꿀",
          "바꿔",
          "변경",
          "교체",
          "재등록",
          "새로 받은",
          "새로운 카드"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "s",
        "condition": "결제정보 조회에서 변경 선택",
        "customer": "이 계약의 결제수단을 바꾸고 싶어요.",
        "message": "선택하신 계약의 결제정보 변경을 도와드릴게요. 계약자 본인 명의의 결제수단을 준비해 주세요.",
        "kind": "intro"
      },
      {
        "id": "S02",
        "stepId": "e",
        "condition": "묶음 결제 계약",
        "message": "같은 묶음 번호의 상품에 변경 사항이 함께 적용돼요. 일괄 변경하시겠어요?",
        "kind": "choice",
        "options": [
          "일괄 변경",
          "나가기"
        ]
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "변경 가능한 계약",
        "message": "등록하실 결제수단을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "신용·체크카드",
          "은행 계좌"
        ]
      },
      {
        "id": "S04",
        "stepId": "j",
        "condition": "카드 선택",
        "message": "카드 정보를 입력하고 PASS 본인인증을 진행해 주세요.",
        "kind": "input",
        "options": [
          "PASS 본인인증"
        ],
        "items": [],
        "fields": [
          {
            "label": "카드번호",
            "value": "••••-••••-••••-1234"
          },
          {
            "label": "유효기간",
            "value": "MM / YY"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          }
        ],
        "secure": true,
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "k",
        "condition": "계좌 선택",
        "message": "계좌 정보를 입력한 뒤 PASS에서 자동이체에 동의해 주세요.",
        "kind": "input",
        "options": [
          "PASS 전자서명"
        ],
        "items": [],
        "fields": [
          {
            "label": "은행",
            "value": "예시은행"
          },
          {
            "label": "계좌번호",
            "value": "••••-••••-1234"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          }
        ],
        "secure": true,
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "h",
        "condition": "변경 제한 계약",
        "message": "이 계약의 결제정보는 챗봇에서 변경하기 어려워요. 상담사가 가능한 방법을 안내해 드려요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "인증·서명 또는 저장 실패",
        "message": "결제정보 변경을 완료하지 못했어요. 입력하신 정보와 인증 결과를 확인해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S08",
        "stepId": "n",
        "condition": "변경 완료",
        "message": "결제정보를 변경했어요. 시스템에 반영되기까지 시간이 걸릴 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "변경된 수단",
            "detail": "신용카드 자동납부 · 예시카드"
          },
          {
            "title": "카드번호",
            "detail": "••••-••••-••••-1234"
          },
          {
            "title": "결제일",
            "detail": "매월 25일"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "가능"
      },
      {
        "from": "c",
        "to": "h",
        "label": "제외·제한 계약"
      },
      {
        "from": "d",
        "to": "e",
        "label": "묶음"
      },
      {
        "from": "d",
        "to": "f",
        "label": "개별"
      },
      {
        "from": "e",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "j",
        "label": "카드"
      },
      {
        "from": "g",
        "to": "k",
        "label": "계좌"
      },
      {
        "from": "j",
        "to": "l",
        "label": "인증 완료"
      },
      {
        "from": "k",
        "to": "l",
        "label": "서명 완료"
      },
      {
        "from": "j",
        "to": "h",
        "label": "인증 실패"
      },
      {
        "from": "k",
        "to": "h",
        "label": "서명 실패"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "n",
        "label": "성공"
      },
      {
        "from": "m",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "r"
      },
      {
        "from": "r",
        "to": "z"
      }
    ]
  },
  {
    "no": 4,
    "title": "요금 납부_렌탈료/멤버십료결제",
    "displayTitle": "요금 납부",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "렌탈료·멤버십료 납부 문의 인입",
    "keywords": [
      "구독료 납부",
      "요금 결제",
      "요금 내기",
      "납부하고 싶어요",
      "이번 달 요금 납부",
      "렌탈료 결제",
      "멤버십료 결제",
      "바로 결제",
      "지금 납부",
      "구독료 내고",
      "렌탈료 내고",
      "요금 내고",
      "이번 달 이용료 내기",
      "즉시 납부",
      "일회성 납부",
      "오늘 결제하고",
      "가상계좌 발급"
    ],
    "intentRules": [
      [
        [
          "요금",
          "구독료",
          "렌탈료",
          "멤버십료",
          "이용료"
        ],
        [
          "내고",
          "내기",
          "납부해",
          "결제해",
          "납부하고",
          "결제하고",
          "납부하려",
          "결제하려",
          "납부할",
          "결제할",
          "납부해줘",
          "결제해줘",
          "내주세요"
        ]
      ],
      [
        [
          "지금",
          "오늘",
          "바로",
          "지금 결제"
        ],
        [
          "요금",
          "구독료",
          "렌탈료",
          "멤버십료",
          "이용료"
        ],
        [
          "납부",
          "결제",
          "내고",
          "내기"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "본인인증·납부 계약 선택",
        "customer": "이번 달 구독료를 납부하고 싶어요.",
        "message": "계약자 본인인증을 한 뒤 납부하실 계약을 선택해 주세요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "d",
        "condition": "납부 가능 계약·이용 가능한 수단 조회",
        "message": "납부 금액을 확인하시고 결제수단을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "등록 결제수단",
          "카드",
          "실시간 계좌이체"
        ],
        "items": [
          {
            "title": "납부 금액",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "d",
        "condition": "등록 결제수단이 타인 명의",
        "message": "등록된 결제수단은 고객님 본인 명의가 아니에요. 이용 가능한 납부 방법을 확인해 주세요.",
        "kind": "choice",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "카드 선택",
        "message": "카드 정보를 입력하고 PASS 본인인증을 진행해 주세요. 5만원 이상은 할부를 선택할 수 있어요.",
        "kind": "input",
        "options": [
          "PASS 본인인증"
        ],
        "items": [],
        "fields": [
          {
            "label": "카드번호",
            "value": "••••-••••-••••-1234"
          },
          {
            "label": "유효기간",
            "value": "MM / YY"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          },
          {
            "label": "할부 기간",
            "value": "일시불 · 5만원 이상 할부 선택"
          }
        ],
        "secure": true,
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "g",
        "condition": "실시간 계좌이체 선택",
        "message": "계좌 정보를 입력하고 PASS에서 전자서명을 진행해 주세요.",
        "kind": "input",
        "options": [
          "PASS 전자서명"
        ],
        "items": [],
        "fields": [
          {
            "label": "은행",
            "value": "예시은행"
          },
          {
            "label": "계좌번호",
            "value": "••••-••••-1234"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          }
        ],
        "secure": true,
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "j",
        "condition": "가상계좌 이용 가능이 확인된 계약",
        "message": "가상계좌를 발급받을 은행과 안내받을 연락처를 입력해 주세요.",
        "kind": "input",
        "options": [
          "가상계좌 발급"
        ],
        "items": [
          {
            "title": "발급 정보",
            "detail": "은행 선택 · 연락처"
          }
        ]
      },
      {
        "id": "S07",
        "stepId": "n",
        "condition": "카드 또는 실시간 계좌이체 납부 성공",
        "message": "29,900원이 납부됐어요. 아래에서 처리 결과를 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "처리 상태",
            "detail": "납부 완료"
          },
          {
            "title": "납부 금액",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "S07V",
        "stepId": "n",
        "condition": "가상계좌 이용 가능 및 발급 성공",
        "message": "가상계좌를 발급했어요. 안내된 계좌로 입금하시면 납부가 처리돼요.",
        "kind": "result",
        "items": [
          {
            "title": "가상계좌",
            "detail": "예시은행 · ••••-••••-1234"
          },
          {
            "title": "입금할 금액",
            "detail": "29,900원"
          },
          {
            "title": "납부 상태",
            "detail": "입금 대기"
          }
        ],
        "demo": true
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "네이버 플랫폼 등 챗봇 납부 제한",
        "message": "이 계약은 챗봇에서 납부할 수 없어요. 상담사를 통해 가능한 납부 방법을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S09",
        "stepId": "h",
        "condition": "인증 실패 또는 납부 요청 실패",
        "message": "납부를 완료하지 못했어요. 결제수단과 인증 결과를 확인해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "가능"
      },
      {
        "from": "c",
        "to": "h",
        "label": "네이버 플랫폼 등 불가"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "카드"
      },
      {
        "from": "e",
        "to": "g",
        "label": "실시간이체"
      },
      {
        "from": "e",
        "to": "j",
        "label": "가상계좌"
      },
      {
        "from": "f",
        "to": "k",
        "label": "인증 완료"
      },
      {
        "from": "g",
        "to": "k",
        "label": "서명 완료"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "f",
        "to": "h",
        "label": "인증 실패"
      },
      {
        "from": "g",
        "to": "h",
        "label": "서명 실패"
      },
      {
        "from": "k",
        "to": "l"
      },
      {
        "from": "l",
        "to": "n",
        "label": "성공·발행"
      },
      {
        "from": "l",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 5,
    "title": "수납 단순문의_미납요금문의",
    "displayTitle": "미납요금 문의",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "미납요금 문의 인입",
    "keywords": [
      "미납",
      "연체",
      "미납금",
      "미납 요금",
      "미납금 납부",
      "밀린 요금",
      "밀린 구독료",
      "연체료",
      "미납됐",
      "미납되었",
      "미납 요금 조회",
      "요금 밀렸",
      "연체금",
      "안 낸 요금",
      "밀린 돈",
      "체납",
      "못 낸 요금",
      "밀린 요금 결제"
    ],
    "intentRules": [
      [
        [
          "요금",
          "렌탈료",
          "렌탈비",
          "구독료",
          "이용료",
          "납부금"
        ],
        [
          "밀렸",
          "밀린",
          "안낸",
          "아직 안 내",
          "내지 못",
          "못 냈",
          "미납",
          "연체",
          "체납"
        ]
      ],
      [
        [
          "안 낸",
          "안 납부",
          "못 낸"
        ],
        [
          "이번달 말고",
          "지난달",
          "예전",
          "미납",
          "렌탈요금"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "본인인증·조회 계약 선택",
        "customer": "밀린 요금이 있나요?",
        "message": "미납요금은 계약자 본인만 확인할 수 있어요. 본인인증 후 계약을 선택해 주세요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "d",
        "condition": "미납금 있음",
        "message": "선택하신 계약의 미납요금이에요.",
        "kind": "result",
        "options": [
          "미납금 납부",
          "추가 문의"
        ],
        "items": [
          {
            "title": "미납금",
            "detail": "29,900원 · 당월 요금 제외"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "n",
        "condition": "미납금 없음",
        "message": "선택하신 계약에 확인되는 미납요금이 없어요.",
        "kind": "result",
        "options": [
          "추가 문의"
        ]
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "미납금 납부 선택",
        "message": "납부 금액을 확인하고 결제수단을 선택해 주세요. 카드와 실시간 계좌이체는 계약자 본인 명의만 가능해요.",
        "kind": "choice",
        "options": [
          "카드",
          "실시간 계좌이체"
        ],
        "items": [
          {
            "title": "납부 금액",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "g",
        "condition": "계약자 본인 명의 카드 선택",
        "message": "카드 정보를 입력하고 PASS 본인인증을 진행해 주세요.",
        "kind": "input",
        "items": [],
        "demo": true,
        "fields": [
          {
            "label": "카드번호",
            "value": "••••-••••-••••-1234"
          },
          {
            "label": "유효기간",
            "value": "MM / YY"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          },
          {
            "label": "할부 기간",
            "value": "일시불 · 5만원 이상 할부 선택"
          }
        ],
        "secure": true,
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S05T",
        "stepId": "g",
        "condition": "계약자 본인 명의 실시간 계좌이체 선택",
        "message": "은행과 계좌 정보를 입력한 뒤 PASS에서 전자서명을 진행해 주세요.",
        "kind": "input",
        "options": [
          "PASS 전자서명"
        ],
        "fields": [
          {
            "label": "은행",
            "value": "예시은행"
          },
          {
            "label": "계좌번호",
            "value": "••••-••••-1234"
          },
          {
            "label": "생년월일",
            "value": "YYMMDD"
          }
        ],
        "secure": true,
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "j",
        "condition": "가상계좌 이용 가능이 확인된 계약",
        "message": "가상계좌를 발급받을 은행과 안내받을 연락처를 입력해 주세요.",
        "kind": "input",
        "options": [
          "가상계좌 발급"
        ],
        "items": [
          {
            "title": "발급 정보",
            "detail": "은행 선택 · 연락처"
          }
        ]
      },
      {
        "id": "S07",
        "stepId": "l",
        "condition": "미납요금 납부 완료",
        "message": "미납요금 29,900원이 납부됐어요.",
        "kind": "result",
        "options": [
          "추가 문의"
        ],
        "demo": true
      },
      {
        "id": "S08",
        "stepId": "l",
        "condition": "가상계좌 발급 완료",
        "message": "가상계좌를 발급했어요. 알림톡의 계좌와 입금 금액을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "가상계좌",
            "detail": "예시은행 · ••••-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "S09",
        "stepId": "h",
        "condition": "납부 제한 또는 처리 실패",
        "message": "챗봇에서 납부를 완료하지 못했어요. 상담사를 통해 가능한 방법을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "b",
        "to": "h",
        "label": "조회 실패"
      },
      {
        "from": "c",
        "to": "d",
        "label": "미납 있음"
      },
      {
        "from": "c",
        "to": "n",
        "label": "미납 없음"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "납부 희망"
      },
      {
        "from": "e",
        "to": "z",
        "label": "안내만"
      },
      {
        "from": "f",
        "to": "g",
        "label": "본인 명의 카드·계좌"
      },
      {
        "from": "f",
        "to": "j",
        "label": "가상계좌"
      },
      {
        "from": "f",
        "to": "h",
        "label": "처리 불가"
      },
      {
        "from": "g",
        "to": "k",
        "label": "인증·서명 완료"
      },
      {
        "from": "g",
        "to": "h",
        "label": "인증 실패"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "성공·발행"
      },
      {
        "from": "k",
        "to": "h",
        "label": "처리 실패"
      },
      {
        "from": "l",
        "to": "z"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 6,
    "title": "수납 단순문의_제휴카드 문의",
    "displayTitle": "제휴카드 문의",
    "phase": "1차",
    "category": "결제·납부",
    "summary": "제휴카드 문의 인입",
    "keywords": [
      "제휴카드",
      "할인 카드",
      "카드 할인",
      "렌탈료 할인",
      "제휴 혜택",
      "렌탈 카드 추천",
      "렌탈 할인",
      "제휴 할인",
      "제휴 카드 추천",
      "할인되는 카드",
      "할인 되는 카드",
      "카드 할인 혜택"
    ],
    "intentRules": [
      [
        [
          "할인",
          "제휴",
          "혜택"
        ],
        [
          "카드",
          "신용카드"
        ],
        [
          "궁금",
          "추천",
          "뭐가",
          "뭐",
          "어떤",
          "알려",
          "있나요",
          "혜택",
          "렌탈"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "s",
        "condition": "제휴카드 문의 인입",
        "customer": "요금 할인이 되는 카드가 있나요?",
        "message": "제휴카드별 이용료 할인 혜택과 신청 방법을 안내해 드릴게요.",
        "kind": "intro"
      },
      {
        "id": "S02",
        "stepId": "b",
        "condition": "제휴카드 목록",
        "message": "혜택을 자세히 보고 싶은 카드를 선택해 주세요.",
        "kind": "choice",
        "options": [
          "예시 제휴카드 혜택 보기"
        ],
        "items": [
          {
            "title": "예시 제휴카드",
            "detail": "이용실적에 따라 구독료 청구 할인 · 신청 문의 02-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "d",
        "condition": "카드 선택",
        "message": "선택하신 카드의 자세한 혜택과 이용 조건은 SK매직몰에서 확인하실 수 있어요.",
        "kind": "result",
        "options": [
          "혜택 상세 보기"
        ],
        "items": [
          {
            "title": "예시 제휴카드",
            "detail": "이용실적에 따라 구독료 청구 할인"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "추가 문의 확인",
        "message": "다른 내용도 도와드릴까요?",
        "kind": "choice",
        "options": [
          "추가 문의",
          "상담 종료"
        ]
      },
      {
        "id": "S05",
        "stepId": "g",
        "condition": "추가 문의 선택",
        "message": "궁금한 내용을 입력해 주세요.",
        "kind": "input",
        "placeholder": "다른 문의 내용을 입력해 주세요"
      },
      {
        "id": "S06",
        "stepId": "z",
        "condition": "상담 종료",
        "message": "이용해 주셔서 감사합니다.",
        "kind": "result"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "카드 선택"
      },
      {
        "from": "c",
        "to": "f",
        "label": "추가 안내 확인"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "f",
        "to": "g",
        "label": "있음"
      },
      {
        "from": "f",
        "to": "z",
        "label": "없음"
      }
    ]
  },
  {
    "no": 7,
    "title": "계약기간/위약금 문의",
    "displayTitle": "계약기간·위약금 문의",
    "phase": "1차",
    "category": "계약·해약",
    "summary": "계약기간 또는 위약금 문의 인입",
    "keywords": [
      "계약기간",
      "위약금",
      "약정",
      "계약 만기",
      "계약 종료일",
      "해지 수수료",
      "의무사용기간",
      "계약 언제 끝",
      "언제 만료",
      "계약 남은 기간",
      "남은 약정",
      "약정 만료",
      "약정 끝",
      "해지하면 얼마",
      "해약하면 얼마",
      "위약금 얼마",
      "위약금 계산"
    ],
    "intentRules": [
      [
        [
          "계약",
          "약정",
          "의무사용",
          "렌탈"
        ],
        [
          "만료",
          "언제까지",
          "언제 끝",
          "종료일",
          "남은 기간",
          "잔여 기간",
          "끝나는 날"
        ]
      ],
      [
        [
          "해약",
          "해지",
          "계약 종료",
          "렌탈 종료"
        ],
        [
          "얼마",
          "위약금",
          "수수료",
          "계산",
          "비용"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "PASS 인증이 필요한 계약자",
        "customer": "계약이 언제 끝나는지 알고 싶어요.",
        "message": "계약기간과 위약금을 조회하려면 계약자 본인인증이 필요해요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "a",
        "condition": "계약 정보 확인",
        "message": "조회하실 계약을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "WPU-1000 · 2025.06.01 가입"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "c",
        "condition": "계약기간 조회",
        "message": "선택하신 계약의 이용 기간이에요.",
        "kind": "result",
        "items": [
          {
            "title": "의무 사용기간",
            "detail": "36개월"
          },
          {
            "title": "전체 계약기간",
            "detail": "60개월"
          },
          {
            "title": "현재 사용기간",
            "detail": "17개월"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "위약금 조회 대상 선택",
        "message": "위약금을 확인할 상품을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택"
        ],
        "items": [
          {
            "title": "조회 대상",
            "detail": "직수 정수기 · WPU-1000"
          }
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "g",
        "condition": "해약접수 예정일 선택",
        "message": "위약금을 계산할 해약접수 예정일을 선택해 주세요. 오늘부터 한 달 이내로 선택할 수 있어요.",
        "kind": "input",
        "options": [
          "날짜 선택"
        ],
        "items": [
          {
            "title": "기준일",
            "detail": "2026년 11월 30일"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "k",
        "condition": "상세 위약금 산정 완료",
        "message": "2026년 11월 30일 기준 예상 위약금이에요. 실제 해약일이나 계약 상태가 달라지면 금액이 달라질 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "예상 위약금",
            "detail": "99,000원"
          }
        ],
        "demo": true
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "복합 패키지 계약",
        "message": "이 상품은 여러 계약이 연결돼 있어요. 상담사를 통해 해약 비용을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "인증 또는 산정 실패",
        "message": "계약 정보를 확인하지 못했거나 위약금을 계산할 수 없었어요. 상담사를 통해 확인하실 수 있어요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b",
        "label": "인증·선택 완료"
      },
      {
        "from": "a",
        "to": "h",
        "label": "인증·계약 확인 실패"
      },
      {
        "from": "b",
        "to": "c",
        "label": "계약기간"
      },
      {
        "from": "b",
        "to": "d",
        "label": "위약금"
      },
      {
        "from": "c",
        "to": "r"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "단일·패키지 유형 확정"
      },
      {
        "from": "e",
        "to": "h",
        "label": "패키지와 크로스 패키지 공존"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k",
        "label": "산정 완료"
      },
      {
        "from": "j",
        "to": "h",
        "label": "API 실패"
      },
      {
        "from": "k",
        "to": "r"
      },
      {
        "from": "r",
        "to": "z"
      }
    ]
  },
  {
    "no": 8,
    "title": "분리/재설치 접수_분리접수",
    "displayTitle": "제품 분리 접수",
    "phase": "1차",
    "category": "배송·설치",
    "summary": "분리 접수 요청",
    "keywords": [
      "분리 접수",
      "제품 분리",
      "정수기 분리",
      "이사 전 분리",
      "철거",
      "분리 재설치",
      "이사 가기 전 떼",
      "이사 전에 분리",
      "정수기 떼",
      "철거 신청",
      "분리 신청",
      "떼어 주세요",
      "분리만 신청",
      "제품 철거",
      "이전 설치 전에 분리"
    ],
    "intentRules": [
      [
        [
          "제품",
          "정수기",
          "이사"
        ],
        [
          "분리",
          "철거",
          "떼어",
          "떼고",
          "떼 주",
          "뗄 수"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "서비스 구분 선택",
        "customer": "이사 전에 제품을 분리하고 싶어요.",
        "message": "제품 분리만 신청하시겠어요? 재설치도 함께 신청하실 수 있어요.",
        "kind": "choice",
        "options": [
          "분리 접수",
          "분리·재설치 접수"
        ]
      },
      {
        "id": "phoneInput",
        "stepId": "b",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "message": "접수 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "b",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "b",
        "condition": "신청자와 제품 확인",
        "message": "분리할 제품을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택",
          "다른 제품"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "정수기 · 구독"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "같은 제품·주소의 진행 중 접수",
        "message": "같은 제품과 주소로 진행 중인 신청이 있어요. 기존 접수를 먼저 확인하실 수 있어요.",
        "kind": "choice",
        "options": [
          "기존 접수 확인",
          "새로 접수"
        ]
      },
      {
        "id": "S04",
        "stepId": "g",
        "condition": "분리 방문 정보 입력",
        "message": "제품을 분리할 주소와 방문 당일 연락받으실 번호를 입력해 주세요. 이사 전날까지만 분리를 예약할 수 있어요.",
        "kind": "input",
        "options": [
          "주소 검색",
          "다음"
        ],
        "items": [
          {
            "title": "방문 정보",
            "detail": "방문 주소 · 당일 연락처"
          }
        ]
      },
      {
        "id": "S05",
        "stepId": "l",
        "condition": "방문 가능일과 예상 비용 확인",
        "message": "방문일을 선택하고 예상 비용을 확인한 뒤 접수해 주세요.",
        "kind": "choice",
        "options": [
          "11월 27일(금) 선택",
          "접수 요청"
        ],
        "items": [
          {
            "title": "예상 비용",
            "detail": "35,000원"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "n",
        "condition": "분리 접수 완료",
        "message": "분리 서비스가 접수됐어요. 방문 예정일을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "제품",
            "detail": "직수 정수기"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "연체 3회 이상",
        "message": "연체 횟수로 인해 지금은 서비스 접수가 어려워요. 미납요금 납부 후 다시 신청해 주세요.",
        "kind": "exception",
        "options": [
          "미납요금 문의"
        ]
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "방문 가능일 없음 또는 접수 실패",
        "message": "챗봇에서 분리 접수를 완료하지 못했어요. 상담사를 통해 가능한 일정을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "가능"
      },
      {
        "from": "c",
        "to": "h",
        "label": "외부 대상·연체 등 제한"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "진행 중"
      },
      {
        "from": "e",
        "to": "g",
        "label": "없음"
      },
      {
        "from": "f",
        "to": "n",
        "label": "기존 신청 확인"
      },
      {
        "from": "f",
        "to": "g",
        "label": "신규 접수"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "가능"
      },
      {
        "from": "k",
        "to": "g",
        "label": "주소 재입력"
      },
      {
        "from": "k",
        "to": "h",
        "label": "불가·가능일 없음"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "n",
        "label": "성공"
      },
      {
        "from": "m",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 9,
    "title": "분리/재설치 접수_재설치접수",
    "displayTitle": "제품 재설치 접수",
    "phase": "1차",
    "category": "배송·설치",
    "summary": "재설치 접수 요청",
    "keywords": [
      "재설치",
      "제품 재설치",
      "이사 후 설치",
      "이전설치 신청",
      "다시 설치",
      "이전 설치 접수",
      "이사했는데 설치",
      "이사한 곳에 설치",
      "새집 설치",
      "설치 다시",
      "이사 이전설치",
      "이사와서 설치",
      "새 주소 설치",
      "제품 재설치 신청",
      "분리한 정수기 설치"
    ],
    "intentRules": [
      [
        [
          "재설치",
          "다시 설치",
          "다시설치",
          "이사",
          "새집",
          "새 주소",
          "옮긴 집"
        ],
        [
          "설치",
          "신청",
          "접수",
          "오세",
          "방문"
        ],
        [
          "제품",
          "정수기",
          "신청",
          "접수",
          "부탁",
          "이전",
          "재설치"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "재설치 접수 유형 선택",
        "customer": "이사한 곳에 제품을 다시 설치해 주세요.",
        "message": "재설치만 신청하거나, 분리와 재설치를 함께 신청하실 수 있어요.",
        "kind": "choice",
        "options": [
          "재설치 접수",
          "분리·재설치 접수"
        ]
      },
      {
        "id": "phoneInput",
        "stepId": "b",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "message": "접수 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "b",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "b",
        "condition": "제품 선택",
        "message": "다시 설치할 제품을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택",
          "다른 제품"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "정수기 · 구독"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "같은 제품·주소의 진행 중 접수",
        "message": "같은 제품과 주소로 진행 중인 신청이 있어요. 기존 접수를 확인하시겠어요?",
        "kind": "choice",
        "options": [
          "기존 접수 확인",
          "새로 접수"
        ]
      },
      {
        "id": "S04",
        "stepId": "g",
        "condition": "재설치 주소·당일 연락처 입력",
        "message": "제품을 설치할 새 주소와 방문 당일 연락받으실 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "주소 검색",
          "다음"
        ],
        "items": [
          {
            "title": "설치 정보",
            "detail": "새 주소 · 당일 연락처"
          }
        ]
      },
      {
        "id": "S05",
        "stepId": "l",
        "condition": "재설치 가능일과 예상 비용 확인",
        "message": "설치받으실 날짜를 선택하고 예상 비용을 확인해 주세요.",
        "kind": "choice",
        "options": [
          "11월 27일(금) 선택",
          "접수 요청"
        ],
        "items": [
          {
            "title": "예상 비용",
            "detail": "35,000원"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "n",
        "condition": "재설치 접수 완료",
        "message": "재설치 서비스가 접수됐어요. 방문 예정일을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "제품",
            "detail": "직수 정수기"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "연체로 접수 제한",
        "message": "연체 횟수로 인해 지금은 재설치를 접수할 수 없어요. 미납요금 납부 후 다시 신청해 주세요.",
        "kind": "exception",
        "options": [
          "미납요금 문의"
        ]
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "설치 불가 지역 또는 가능일 없음",
        "message": "입력하신 주소에서 예약을 진행하기 어려워요. 주소를 다시 확인하거나 상담사에게 문의해 주세요.",
        "kind": "handoff",
        "options": [
          "주소 다시 입력",
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "가능"
      },
      {
        "from": "c",
        "to": "h",
        "label": "외부 대상·연체 등 제한"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "진행 중"
      },
      {
        "from": "e",
        "to": "g",
        "label": "없음"
      },
      {
        "from": "f",
        "to": "n",
        "label": "기존 신청 확인"
      },
      {
        "from": "f",
        "to": "g",
        "label": "신규 접수"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "가능"
      },
      {
        "from": "k",
        "to": "g",
        "label": "주소 재입력"
      },
      {
        "from": "k",
        "to": "h",
        "label": "불가·가능일 없음"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "n",
        "label": "성공"
      },
      {
        "from": "m",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 10,
    "title": "명의변경 문의 / 명의변경 신청 (선납취소·면제취소 포함)",
    "displayTitle": "명의변경 문의·신청",
    "phase": "1차",
    "category": "계약·해약",
    "summary": "명의변경 문의 또는 신청 인입",
    "keywords": [
      "명의변경",
      "명의 변경",
      "계약 명의",
      "양도",
      "양수",
      "명의 이전",
      "선납 취소",
      "면제 취소",
      "명의를 바꾸",
      "계약자 변경",
      "계약자 명의 바꾸",
      "계약 넘기기",
      "렌탈 명의",
      "가족에게 양도",
      "명의 이전 신청"
    ],
    "intentRules": [
      [
        [
          "가족에게",
          "동생한테",
          "아들에게",
          "딸에게",
          "아내에게",
          "남편에게",
          "계약",
          "렌탈",
          "구독"
        ],
        [
          "양도",
          "양수",
          "넘기",
          "명의",
          "계약자 변경"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "양도인 본인인증 필요",
        "customer": "제품 계약 명의를 바꾸고 싶어요.",
        "message": "계약을 넘겨주시는 분의 본인인증이 필요해요.",
        "kind": "intro",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S02",
        "stepId": "c",
        "condition": "신청 방법 문의",
        "message": "명의변경은 계약을 넘겨주시는 분이 신청해 주세요. 신청할 때 새 계약자의 정보를 준비해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "준비할 정보",
            "detail": "이름 · 연락처 · 생년월일 · 개인사업자는 사업자번호"
          }
        ]
      },
      {
        "id": "S03",
        "stepId": "d",
        "condition": "변경 대상 계약 선택",
        "message": "명의를 변경하실 상품을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "WPU-1000 · 구독 이용 중"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "미납 또는 당월 청구 요금 미납",
        "message": "이 계약에 납부하실 요금이 있어요. 요금을 납부한 뒤 명의변경을 다시 신청해 주세요.",
        "kind": "exception",
        "options": [
          "요금 납부"
        ]
      },
      {
        "id": "S05",
        "stepId": "f",
        "condition": "선납 할인 등 신청 제한",
        "message": "선택한 계약은 현재 상태에서 명의변경을 신청하기 어려워요. 상담사가 가능한 절차를 확인해 드려요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S06",
        "stepId": "g",
        "condition": "신청 가능·양수인 정보 입력",
        "message": "계약을 넘겨받으실 분의 유형을 선택하고 필요한 정보를 입력해 주세요.",
        "kind": "input",
        "options": [
          "개인",
          "개인사업자",
          "법인",
          "기타 유형"
        ],
        "items": [
          {
            "title": "신청 정보",
            "detail": "양수인 유형 · 이름 · 연락처"
          }
        ]
      },
      {
        "id": "S07",
        "stepId": "v",
        "condition": "구비서류가 필요한 유형",
        "message": "이 유형은 추가 서류가 필요해요. 접수 후 받으신 알림톡에서 준비할 서류와 제출 방법을 확인해 주세요.",
        "kind": "result"
      },
      {
        "id": "S08",
        "stepId": "n",
        "condition": "신청 접수 완료",
        "message": "명의변경 신청이 접수됐어요. 다음 절차는 알림톡에서 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "진행 상태",
            "detail": "신청 접수"
          }
        ],
        "demo": true
      },
      {
        "id": "S09",
        "stepId": "h",
        "condition": "본인인증 또는 접수 실패",
        "message": "본인 확인 또는 신청 접수를 완료하지 못했어요. 진행이 어려우시면 상담사에게 문의해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b",
        "label": "인증 완료"
      },
      {
        "from": "a",
        "to": "h",
        "label": "인증 실패"
      },
      {
        "from": "b",
        "to": "c",
        "label": "방법 문의"
      },
      {
        "from": "b",
        "to": "d",
        "label": "신청"
      },
      {
        "from": "c",
        "to": "z"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "조건 불충족"
      },
      {
        "from": "e",
        "to": "g",
        "label": "가능"
      },
      {
        "from": "f",
        "to": "z"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k",
        "label": "다이렉트"
      },
      {
        "from": "j",
        "to": "v",
        "label": "비다이렉트·특수 유형"
      },
      {
        "from": "v",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "접수 완료"
      },
      {
        "from": "k",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "n"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 11,
    "title": "고장상담_일반(기술상담)",
    "displayTitle": "제품 고장 상담",
    "phase": "1차",
    "category": "AS·케어",
    "summary": "기술상담 요청",
    "keywords": [
      "고장상담",
      "기술상담",
      "제품 고장",
      "정수기 소음",
      "이상한 소리",
      "작동 안함",
      "오류 증상",
      "누수",
      "고장났어요",
      "작동이 안",
      "물이 안 나와",
      "물이 계속 새",
      "오류 뜨",
      "이상한 소음",
      "제품이 안 켜",
      "버튼이 안 눌려",
      "작동 불량",
      "물 안나옴",
      "제품에서 소리"
    ],
    "intentRules": [
      [
        [
          "정수기",
          "공기청정기",
          "비데",
          "제품",
          "기기",
          "가스레인지",
          "식기세척기"
        ],
        [
          "고장",
          "안 나",
          "안 켜",
          "켜지지",
          "안 되",
          "되지 않",
          "안돼",
          "이상",
          "누수",
          "불량",
          "에러",
          "오류",
          "화면이 꺼"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "기술상담 인입·제품 확인",
        "customer": "제품에서 이상한 소리가 나요.",
        "message": "어떤 제품을 사용하고 계신가요? 상담받으실 제품을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "정수기 선택"
        ],
        "items": [
          {
            "title": "나의 보유제품",
            "detail": "직수 정수기 · WPU-1000"
          }
        ],
        "demo": true
      },
      {
        "id": "S02",
        "stepId": "d",
        "condition": "SK매직 상담 대상 제품",
        "message": "제품에서 어떤 증상이 나타나는지 선택해 주세요.",
        "kind": "input",
        "options": [
          "증상 선택"
        ],
        "items": [
          {
            "title": "증상 분류",
            "detail": "대분류 · 중분류 · 소분류"
          }
        ]
      },
      {
        "id": "S03",
        "stepId": "c",
        "condition": "외부 서비스 대행 대상",
        "message": "이 제품은 서비스 대행업체에서 상담받으실 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 업체",
            "detail": "경동나비엔"
          },
          {
            "title": "문의 번호",
            "detail": "공식 고객센터"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "긴급 증상",
        "message": "입력하신 증상은 빠른 확인이 필요해요. 상담사에게 연결해 드릴까요?",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S05",
        "stepId": "k",
        "condition": "자가조치 콘텐츠 있음",
        "message": "이 증상에 대해 직접 확인해 보실 수 있는 방법이 있어요.",
        "kind": "result",
        "options": [
          "자가조치 보기"
        ],
        "items": [
          {
            "title": "자가조치 안내",
            "detail": "정수기 출수 문제 자가 점검"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "l",
        "condition": "자가조치 미해결 또는 제공 콘텐츠 없음",
        "message": "추가 도움이 필요하시면 방문 서비스를 접수하거나 상담사에게 문의하실 수 있어요.",
        "kind": "choice",
        "options": [
          "AS 서비스 접수",
          "상담사 연결",
          "추가 문의"
        ]
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "상담 운영시간 외",
        "message": "지금은 상담사 운영시간이 아니에요. 전화 상담을 예약하시면 운영시간에 연락드려요.",
        "kind": "handoff",
        "options": [
          "상담사 전화 예약"
        ],
        "items": [
          {
            "title": "상담 운영시간",
            "detail": "평일 09:00–18:00"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "외부 대상"
      },
      {
        "from": "b",
        "to": "d",
        "label": "SK매직"
      },
      {
        "from": "c",
        "to": "z"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "긴급"
      },
      {
        "from": "e",
        "to": "g",
        "label": "일반"
      },
      {
        "from": "f",
        "to": "h"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k",
        "label": "있음"
      },
      {
        "from": "j",
        "to": "l",
        "label": "없음"
      },
      {
        "from": "k",
        "to": "l"
      },
      {
        "from": "l",
        "to": "m",
        "label": "AS 접수"
      },
      {
        "from": "l",
        "to": "h",
        "label": "상담사 요청"
      },
      {
        "from": "l",
        "to": "z",
        "label": "해결·종료"
      }
    ]
  },
  {
    "no": 12,
    "title": "고장상담_AS접수_일반",
    "displayTitle": "AS 방문 접수",
    "phase": "1차",
    "category": "AS·케어",
    "summary": "AS 서비스 접수 요청",
    "keywords": [
      "AS 접수",
      "방문 수리",
      "수리 신청",
      "고장 접수",
      "기사 방문 신청",
      "정수기 AS 신청",
      "기사님 보내",
      "수리 접수",
      "방문 접수해",
      "기사님 불러",
      "AS 신청",
      "AS 접수해",
      "A/S 접수해",
      "고장 방문 신청",
      "수리기사 방문",
      "기사 방문 요청",
      "수리해 주세요"
    ],
    "intentRules": [
      [
        [
          "AS",
          "수리",
          "기사",
          "고장"
        ],
        [
          "방문 신청",
          "방문 요청",
          "보내 주세요",
          "보내 주세",
          "접수",
          "불러",
          "신청",
          "수리해"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "AS 방문 접수 인입",
        "customer": "정수기 고장으로 방문을 요청하고 싶어요.",
        "message": "방문 접수에 필요한 제품과 고장 증상을 확인해 주세요.",
        "kind": "input",
        "options": [
          "다음"
        ],
        "items": [
          {
            "title": "접수 정보",
            "detail": "제품군 · 모델명 · 증상"
          }
        ]
      },
      {
        "id": "S02",
        "stepId": "b",
        "condition": "비로그인 신청자 · 휴대폰 확인 필요",
        "message": "신청 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "items": [],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "b",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "같은 제품·증상의 진행 중 접수",
        "message": "같은 제품과 증상으로 접수된 건이 있어요. 기존 접수를 보시겠어요?",
        "kind": "choice",
        "options": [
          "기존 접수 확인",
          "새로 접수"
        ]
      },
      {
        "id": "S04",
        "stepId": "g",
        "condition": "방문 주소와 당일 연락처 수집",
        "message": "서비스를 받을 주소와 방문 당일 연락받으실 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "주소 검색",
          "다음"
        ],
        "items": [
          {
            "title": "방문 정보",
            "detail": "방문 주소 · 당일 연락처"
          }
        ]
      },
      {
        "id": "S05",
        "stepId": "l",
        "condition": "서비스 가능한 주소·방문일 조회 성공",
        "message": "희망 방문일과 예상 비용을 확인하시고 접수를 요청해 주세요.",
        "kind": "choice",
        "options": [
          "11월 27일(금) 선택",
          "접수 요청"
        ],
        "items": [
          {
            "title": "예상 비용",
            "detail": "35,000원"
          }
        ],
        "demo": true
      },
      {
        "id": "regAddrPass",
        "stepId": "l",
        "condition": "구독 계약 · 새 주소 선택 · PASS 기완료 아님",
        "message": "구독 제품의 방문 주소를 새 주소로 변경하려면 PASS 본인인증이 필요해요.",
        "kind": "choice",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "S06",
        "stepId": "n",
        "condition": "접수 완료",
        "message": "방문 서비스가 접수됐어요. 예약 정보를 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          },
          {
            "title": "담당 매니저",
            "detail": "방문 담당 매니저"
          }
        ],
        "demo": true
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "연체 3회 이상",
        "message": "연체 횟수로 인해 지금은 방문 서비스를 접수할 수 없어요. 미납요금을 납부한 뒤 신청해 주세요.",
        "kind": "exception",
        "options": [
          "미납요금 문의"
        ]
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "서비스 불가 지역 또는 유효하지 않은 주소",
        "message": "입력하신 주소로 서비스를 접수하기 어려워요. 주소를 다시 입력하시겠어요?",
        "kind": "exception",
        "options": [
          "주소 다시 입력",
          "상담사 연결"
        ]
      },
      {
        "id": "S09",
        "stepId": "h",
        "condition": "예약 가능일 없음 또는 접수 실패",
        "message": "챗봇에서 방문 예약을 완료하지 못했어요. 상담사를 통해 다음 절차를 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d",
        "label": "가능"
      },
      {
        "from": "c",
        "to": "h",
        "label": "연체 3회 이상·외부 대상"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "있음"
      },
      {
        "from": "e",
        "to": "g",
        "label": "없음"
      },
      {
        "from": "f",
        "to": "n",
        "label": "기존 접수 확인"
      },
      {
        "from": "f",
        "to": "g",
        "label": "새로 접수"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "가능"
      },
      {
        "from": "k",
        "to": "g",
        "label": "주소 재입력"
      },
      {
        "from": "k",
        "to": "h",
        "label": "예약 불가"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "n",
        "label": "성공"
      },
      {
        "from": "m",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "r"
      },
      {
        "from": "r",
        "to": "z"
      }
    ]
  },
  {
    "no": 13,
    "title": "단순상담_AS 접수/일정/방문 확인",
    "displayTitle": "AS 일정·방문 조회",
    "phase": "1차",
    "category": "AS·케어",
    "summary": "접수·일정·방문 확인 문의",
    "keywords": [
      "AS 일정 문의",
      "AS 일정 조회",
      "AS 접수 조회",
      "서비스 방문 시간",
      "기사님 언제",
      "기사 방문 확인",
      "수리 일정 확인",
      "AS 날짜",
      "AS 방문일",
      "AS 언제",
      "AS 몇 시",
      "수리 기사 언제",
      "기사님 몇 시",
      "방문하는 시간",
      "수리 접수 내역",
      "접수했는데 언제",
      "AS 신청 내역",
      "출동 일정"
    ],
    "intentRules": [
      [
        [
          "AS",
          "수리",
          "기사",
          "서비스 방문"
        ],
        [
          "언제",
          "몇 시",
          "시간",
          "날짜",
          "일정",
          "오는지",
          "오시는지"
        ],
        [
          "조회",
          "확인",
          "알려",
          "신청했",
          "신청은 했",
          "접수했",
          "인가요",
          "오나요",
          "방문이"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "customer": "AS 기사님이 언제 오시나요?",
        "message": "신청 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "items": [],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "a",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "e",
        "condition": "미처리 접수 여러 건",
        "message": "방문일이 가까운 순으로 최대 5건을 보여드려요. 확인할 접수를 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 접수 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "정수 출수 안 됨 · 2026년 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "접수 상세·AS",
        "message": "선택하신 AS 방문 예약 정보예요.",
        "kind": "result",
        "options": [
          "접수내용 변경",
          "접수 취소"
        ],
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "접수 증상",
            "detail": "정수 출수 안 됨"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          },
          {
            "title": "담당 매니저",
            "detail": "방문 담당 매니저"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "접수 상세·분리 또는 재설치",
        "message": "선택하신 분리·재설치 방문 예약 정보예요.",
        "kind": "result",
        "options": [
          "접수내용 변경",
          "접수 취소"
        ],
        "items": [
          {
            "title": "서비스 종류",
            "detail": "재설치"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          },
          {
            "title": "방문 주소",
            "detail": "서울 영등포구 문래동"
          }
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "n",
        "condition": "통합고객과 일치하는 정보 없음",
        "message": "입력하신 정보와 일치하는 고객 내역을 찾지 못했어요.",
        "kind": "exception"
      },
      {
        "id": "S06",
        "stepId": "n",
        "condition": "고객 확인 후 미처리 접수 0건",
        "message": "현재 확인되는 방문 서비스 예정 건이 없어요.",
        "kind": "result"
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "다계정·법인·조회 실패",
        "message": "챗봇에서 접수 내역을 확인하기 어려워요. 상담사를 통해 확인하실 수 있어요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "1건"
      },
      {
        "from": "b",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "b",
        "to": "h",
        "label": "다건·법인·실패"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "c",
        "to": "h",
        "label": "조회 실패"
      },
      {
        "from": "d",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "d",
        "to": "f",
        "label": "1건"
      },
      {
        "from": "d",
        "to": "e",
        "label": "다건"
      },
      {
        "from": "e",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "j"
      },
      {
        "from": "j",
        "to": "k",
        "label": "변경·취소"
      },
      {
        "from": "j",
        "to": "z",
        "label": "기타·종료"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 14,
    "title": "AS접수 수정_접수수정",
    "displayTitle": "AS 접수 수정",
    "phase": "1차",
    "category": "AS·케어",
    "summary": "서비스 접수 수정 요청",
    "keywords": [
      "AS 접수 수정",
      "AS 일정 변경",
      "AS 방문 변경",
      "서비스 시간 변경",
      "방문 기사 일정 바꾸기",
      "AS 변경",
      "AS 일정 바꾸",
      "AS 날짜 바꾸",
      "기사 방문일 변경",
      "기사님 다른 시간",
      "수리 시간 변경",
      "수리 날짜 바꾸",
      "서비스 방문 옮기",
      "AS 예약 변경",
      "AS 시간 변경"
    ],
    "intentRules": [
      [
        [
          "AS",
          "수리",
          "기사",
          "서비스 방문"
        ],
        [
          "일정",
          "날짜",
          "시간",
          "다른 날",
          "예약",
          "접수"
        ],
        [
          "변경",
          "바꾸",
          "바꿀",
          "바꿔",
          "옮겨",
          "미루",
          "당겨",
          "늦춰"
        ]
      ]
    ],
    "screens": [
      {
        "id": "phoneInput",
        "stepId": "a",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "message": "접수 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "a",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S01",
        "stepId": "a",
        "condition": "수정할 접수 선택",
        "customer": "AS 방문 날짜를 바꾸고 싶어요.",
        "message": "변경하실 서비스 접수를 선택해 주세요. 방문일이 가까운 순으로 최대 5건을 보여드려요.",
        "kind": "choice",
        "options": [
          "직수 정수기 접수 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "고장 방문 · 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S02",
        "stepId": "c",
        "condition": "수정 가능 접수·상세 확인",
        "message": "변경하실 항목을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "방문주소",
          "방문예정일",
          "접수 증상",
          "방문 연락처"
        ],
        "items": [
          {
            "title": "기존 접수",
            "detail": "AS-261125-001 · 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "일시불 계약의 주소 변경",
        "message": "변경할 방문주소를 입력해 주세요.",
        "kind": "input",
        "options": [
          "주소 검색",
          "변경 요청"
        ],
        "items": [
          {
            "title": "새 방문주소",
            "detail": "도로명 또는 지번 · 상세주소"
          }
        ]
      },
      {
        "id": "S04",
        "stepId": "g",
        "condition": "방문일 변경·예약 가능일 있음",
        "message": "변경할 방문일을 선택해 주세요. 가까운 예약 가능일부터 보여드려요.",
        "kind": "choice",
        "options": [
          "11월 27일(금) 선택",
          "더보기",
          "변경 요청"
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "j",
        "condition": "접수 증상 또는 당일 연락번호 변경",
        "message": "바꾸실 증상이나 방문 당일 연락받으실 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "변경 요청"
        ],
        "items": [
          {
            "title": "현재 정보",
            "detail": "정수 출수 안 됨"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "h",
        "condition": "방문예정일 당일",
        "message": "오늘 방문 예정인 서비스는 챗봇에서 변경할 수 없어요. 상담사에게 연결해 드릴게요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "구독·멤버십 계약의 주소 변경",
        "message": "구독·멤버십 제품의 방문주소 변경은 상담사가 도와드려요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S08",
        "stepId": "f",
        "condition": "바꿀 주소에서 서비스 불가",
        "message": "입력하신 주소로 방문하기 어려워요. 주소를 다시 입력하거나 상담사에게 문의해 주세요.",
        "kind": "exception",
        "options": [
          "주소 다시 입력",
          "상담사 연결"
        ]
      },
      {
        "id": "S09",
        "stepId": "n",
        "condition": "미처리 접수 없음",
        "message": "현재 변경하실 수 있는 방문 서비스 접수가 없어요.",
        "kind": "result"
      },
      {
        "id": "S10",
        "stepId": "m",
        "condition": "변경 완료",
        "message": "서비스 접수 내역을 변경했어요. 변경된 정보를 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "변경된 항목",
            "detail": "방문 예정일 · 11월 30일(월)"
          }
        ],
        "demo": true
      },
      {
        "id": "S11",
        "stepId": "h",
        "condition": "예약 가능일 없음 또는 저장 실패",
        "message": "서비스 접수를 변경하지 못했어요. 상담사를 통해 가능한 일정과 접수 상태를 확인해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "있음"
      },
      {
        "from": "b",
        "to": "n",
        "label": "없음"
      },
      {
        "from": "b",
        "to": "h",
        "label": "특정·조회 실패"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "h",
        "label": "당일"
      },
      {
        "from": "d",
        "to": "e",
        "label": "당일 아님"
      },
      {
        "from": "e",
        "to": "f",
        "label": "일시불 방문주소"
      },
      {
        "from": "e",
        "to": "h",
        "label": "구독·멤버십 방문주소"
      },
      {
        "from": "e",
        "to": "g",
        "label": "일정"
      },
      {
        "from": "e",
        "to": "j",
        "label": "증상·연락번호"
      },
      {
        "from": "f",
        "to": "f",
        "label": "주소 재입력"
      },
      {
        "from": "f",
        "to": "k",
        "label": "주소 확인"
      },
      {
        "from": "g",
        "to": "k",
        "label": "일정 선택"
      },
      {
        "from": "g",
        "to": "h",
        "label": "선택 가능일 없음"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l"
      },
      {
        "from": "l",
        "to": "m",
        "label": "성공"
      },
      {
        "from": "l",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "n",
        "to": "z"
      },
      {
        "from": "m",
        "to": "z"
      }
    ]
  },
  {
    "no": 15,
    "title": "AS서비스 상담/접수_접수취소",
    "displayTitle": "AS 접수 취소",
    "phase": "1차",
    "category": "AS·케어",
    "summary": "서비스 접수 취소 요청",
    "keywords": [
      "AS 접수 취소",
      "방문 서비스 취소",
      "수리 예약 취소",
      "AS 취소",
      "점검 접수 취소",
      "AS 방문 취소",
      "AS 예약 취소",
      "AS 신청 취소",
      "수리 신청 취소",
      "수리 접수 취소",
      "기사 방문 취소",
      "AS 예약 없애",
      "기사님 오지 마",
      "기사님 안 와도"
    ],
    "intentRules": [
      [
        [
          "AS",
          "수리",
          "기사 방문",
          "서비스 방문"
        ],
        [
          "예약",
          "신청",
          "방문",
          "접수",
          "기사"
        ],
        [
          "취소",
          "안 와도",
          "오지 마",
          "없애"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "customer": "신청한 방문 서비스를 취소하고 싶어요.",
        "message": "신청 내용을 확인할 수 있도록 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "items": [],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "a",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "d",
        "condition": "취소 대상 선택·상세 확인",
        "message": "취소하실 서비스 접수를 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 접수 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "고장 방문 · 2026년 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "취소 가능한 접수",
        "message": "접수 취소 사유를 선택해 주세요.",
        "kind": "choice",
        "options": [
          "개인 일정",
          "정상 작동 또는 직접 처리",
          "미사용 또는 새 제품 구입",
          "비용 부담",
          "기타"
        ]
      },
      {
        "id": "S04",
        "stepId": "g",
        "condition": "취소 사유 선택 후",
        "message": "선택하신 서비스 접수를 취소하시겠어요?",
        "kind": "choice",
        "options": [
          "취소 요청",
          "나가기"
        ],
        "items": [
          {
            "title": "접수번호",
            "detail": "AS-261125-001"
          },
          {
            "title": "방문 예정일",
            "detail": "2026년 11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "S05",
        "stepId": "m",
        "condition": "취소 완료",
        "message": "서비스 접수가 취소됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "취소된 접수",
            "detail": "AS-261125-001"
          }
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "n",
        "condition": "취소 대상 접수 없음",
        "message": "현재 취소하실 수 있는 방문 서비스 접수가 없어요.",
        "kind": "result"
      },
      {
        "id": "S07",
        "stepId": "h",
        "condition": "방문예정일 당일",
        "message": "오늘 방문 예정인 서비스는 챗봇에서 취소할 수 없어요. 상담사에게 연결해 드릴게요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S08",
        "stepId": "h",
        "condition": "취소 요청 실패",
        "message": "서비스 접수를 취소하지 못했어요. 상담사를 통해 현재 접수 상태를 확인해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b",
        "label": "확인"
      },
      {
        "from": "a",
        "to": "h",
        "label": "특정 실패"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "b",
        "to": "h",
        "label": "조회 실패"
      },
      {
        "from": "c",
        "to": "d",
        "label": "있음"
      },
      {
        "from": "c",
        "to": "n",
        "label": "없음"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "h",
        "label": "당일"
      },
      {
        "from": "e",
        "to": "f",
        "label": "당일 아님"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "j",
        "label": "취소 요청"
      },
      {
        "from": "g",
        "to": "z",
        "label": "나가기"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "m",
        "label": "성공"
      },
      {
        "from": "k",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "m",
        "to": "z"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 16,
    "title": "배송 단순문의_배송/설치일정/방문시간 문의",
    "displayTitle": "배송·설치 일정 문의",
    "phase": "1차",
    "category": "배송·설치",
    "summary": "배송·설치일정 문의 인입",
    "keywords": [
      "배송조회",
      "배송일",
      "배송 일정",
      "배송 날짜",
      "설치 일정",
      "설치 방문 시간",
      "제품 언제 배송",
      "언제 도착",
      "배송 언제",
      "언제 배송",
      "배송 조회",
      "배송 시간",
      "배송 날짜 조회",
      "설치 기사 언제",
      "배송 기사 몇 시",
      "배송 받는 날",
      "설치일 조회",
      "설치는 언제",
      "설치 날짜 확인",
      "제품 언제 와"
    ],
    "intentRules": [
      [
        [
          "배송",
          "설치",
          "주문",
          "새 정수기"
        ],
        [
          "언제",
          "몇 시",
          "어느 날",
          "일정",
          "날짜",
          "오는지",
          "도착",
          "배송일"
        ],
        [
          "조회",
          "확인",
          "알려",
          "궁금",
          "인가요",
          "언제",
          "몇 시"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "customer": "제품이 언제 배송되는지 알고 싶어요.",
        "message": "배송 주문을 조회하려면 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "items": [],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "a",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "e",
        "condition": "배송 주문 묶음 1~4건",
        "message": "확인하실 배송 주문을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 주문 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "납품대기 · 2026년 11월 30일(월)"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "f",
        "condition": "선택 주문 배송 정보 조회",
        "message": "선택하신 주문의 배송 정보예요.",
        "kind": "result",
        "items": [
          {
            "title": "주문번호",
            "detail": "DL-261125-001"
          },
          {
            "title": "배송 예정일",
            "detail": "2026년 11월 30일(월)"
          },
          {
            "title": "배송지",
            "detail": "서울 영등포구 문래동"
          },
          {
            "title": "주문 상태",
            "detail": "납품대기"
          }
        ],
        "demo": true
      },
      {
        "id": "S04",
        "stepId": "n",
        "condition": "해당 주문 0건",
        "message": "현재 확인되는 배송 주문이 없어요.",
        "kind": "result"
      },
      {
        "id": "S05",
        "stepId": "h",
        "condition": "법인·다계정 또는 주문 묶음 5건 초과",
        "message": "챗봇에서 배송 주문을 확인하기 어려워요. 상담사를 통해 배송 정보를 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S06",
        "stepId": "h",
        "condition": "인증 또는 주문 조회 실패",
        "message": "배송 주문 정보를 가져오지 못했어요. 확인이 필요하시면 상담사에게 문의해 주세요.",
        "kind": "exception",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S07",
        "stepId": "z",
        "condition": "조회 안내 뒤 추가 문의",
        "message": "다른 내용도 도와드릴까요?",
        "kind": "choice",
        "options": [
          "추가 문의",
          "상담 종료"
        ]
      },
      {
        "id": "pending5",
        "stepId": "j",
        "kind": "internal-only",
        "condition": "배송 주문 묶음번호 정확히 5건",
        "message": "원본에 정확히 5건일 때의 처리 경로가 비어 있습니다. 목록 노출 또는 상담사 연결 기준이 확정되면 고객 화면을 반영합니다."
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "개인·개인사업자 확인"
      },
      {
        "from": "b",
        "to": "h",
        "label": "법인·다계정·실패"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "c",
        "to": "h",
        "label": "조회 실패"
      },
      {
        "from": "d",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "d",
        "to": "e",
        "label": "1~4건"
      },
      {
        "from": "d",
        "to": "j",
        "label": "정확히 5건"
      },
      {
        "from": "d",
        "to": "h",
        "label": "5건 초과"
      },
      {
        "from": "e",
        "to": "f"
      },
      {
        "from": "f",
        "to": "g"
      },
      {
        "from": "g",
        "to": "z"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 17,
    "title": "배송 단순문의_고객정보확인/변경",
    "displayTitle": "배송정보 확인·변경",
    "phase": "1차",
    "category": "배송·설치",
    "summary": "배송 설치 변경 요청",
    "keywords": [
      "배송 변경",
      "배송주소 수정",
      "배송 주소 변경",
      "배송일 변경",
      "배송일정 수정",
      "배송지 바꾸기",
      "설치 날짜 변경",
      "설치마스터 전달",
      "배송지 변경",
      "배송 날짜 바꾸",
      "배송지 주소를 바꾸",
      "배송 주소를 바꾸",
      "배송 받을 주소 변경",
      "받을 주소를 바꾸",
      "배송 날짜 미루",
      "배송 일정을 옮기",
      "설치를 미루",
      "설치일 바꾸",
      "설치 일정 변경",
      "설치 일정 바꾸"
    ],
    "intentRules": [
      [
        [
          "배송",
          "설치"
        ],
        [
          "주소",
          "날짜",
          "시간",
          "일정",
          "배송지",
          "받는 곳",
          "예약",
          "받는 집",
          "새집"
        ],
        [
          "변경",
          "바꾸",
          "바꿀",
          "바꿔",
          "다른 곳",
          "옮겨",
          "미루",
          "당겨"
        ]
      ]
    ],
    "screens": [
      {
        "id": "S01",
        "stepId": "a",
        "condition": "비로그인 고객 · 휴대폰 확인 필요",
        "customer": "배송받을 주소를 바꾸고 싶어요.",
        "message": "배송 주문을 찾기 위해 주문하신 분의 이름과 휴대폰 번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "인증번호 받기"
        ],
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "items": [],
        "demo": true
      },
      {
        "id": "phoneConfirm",
        "stepId": "a",
        "condition": "휴대폰 확인 · 인증번호 발송 완료",
        "message": "문자로 받은 인증번호를 입력해 주세요.",
        "kind": "input",
        "options": [
          "확인",
          "인증번호 재전송"
        ],
        "fields": [
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          },
          {
            "label": "인증번호",
            "value": "문자로 받은 인증번호 입력"
          }
        ],
        "demo": true,
        "secure": true
      },
      {
        "id": "S02",
        "stepId": "d",
        "condition": "배송 주문 묶음 1~4건",
        "message": "변경하시거나 설치마스터에게 요청을 전달할 주문을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "직수 정수기 주문 선택"
        ],
        "items": [
          {
            "title": "직수 정수기",
            "detail": "납품대기 · 2026년 11월 30일(월)"
          }
        ],
        "demo": true
      },
      {
        "id": "S03",
        "stepId": "e",
        "condition": "선택 주문에서 요청할 업무 구분",
        "message": "어떤 정보를 변경하거나 전달하시겠어요? 패키지 주문은 구성 상품 전체에 주소나 일정 변경이 적용돼요.",
        "kind": "choice",
        "options": [
          "배송주소 수정",
          "배송일정 수정",
          "설치마스터 전달"
        ]
      },
      {
        "id": "S04",
        "stepId": "f",
        "condition": "배송주소 수정 가능",
        "message": "변경하실 배송 주소를 입력해 주세요.",
        "kind": "input",
        "options": [
          "주소 검색",
          "변경 요청"
        ],
        "items": [
          {
            "title": "새 배송주소",
            "detail": "도로명 또는 지번 · 상세주소"
          }
        ]
      },
      {
        "id": "S05",
        "stepId": "g",
        "condition": "배송일정 수정 가능",
        "message": "희망하시는 배송일을 선택해 주세요. 예약 가능한 날짜를 보여드릴게요.",
        "kind": "choice",
        "options": [
          "12월 2일(수) 선택",
          "더보기",
          "변경 요청"
        ],
        "demo": true
      },
      {
        "id": "S06",
        "stepId": "j",
        "condition": "설치마스터 전달 선택",
        "message": "설치마스터에게 전달할 내용을 입력해 주세요. 설치 예정일에 확인할 수 있어요.",
        "kind": "input",
        "options": [
          "전달 요청"
        ],
        "placeholder": "전달할 내용을 입력해 주세요"
      },
      {
        "id": "S07",
        "stepId": "m",
        "condition": "주소·일정 변경 완료",
        "message": "배송 정보를 변경했어요. 변경된 내용을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "변경 내용",
            "detail": "배송 예정일 · 12월 2일(수)"
          }
        ],
        "demo": true
      },
      {
        "id": "S08",
        "stepId": "m",
        "condition": "설치마스터 전달 요청 등록 완료",
        "message": "설치마스터에게 전달할 요청이 등록됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "요청사항",
            "detail": "방문 전에 전화 부탁드립니다."
          }
        ],
        "demo": true
      },
      {
        "id": "S09",
        "stepId": "f",
        "condition": "입력한 주소에서 배송 불가",
        "message": "해당 지역에는 배송할 수 없어요. 배송 주소를 다시 입력하시겠어요?",
        "kind": "exception",
        "options": [
          "주소 다시 입력",
          "상담사 연결"
        ]
      },
      {
        "id": "S10",
        "stepId": "h",
        "condition": "배송 변경 불가 상태 또는 배송 가능일 없음",
        "message": "현재 주문은 챗봇에서 변경하기 어려워요. 상담사를 통해 가능한 방법을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      },
      {
        "id": "S11",
        "stepId": "n",
        "condition": "변경 가능한 배송 주문 0건",
        "message": "변경하실 수 있는 배송 주문이 확인되지 않아요.",
        "kind": "result"
      },
      {
        "id": "pending5",
        "stepId": "q",
        "kind": "internal-only",
        "condition": "배송 주문 묶음번호 정확히 5건",
        "message": "원본에 정확히 5건일 때의 처리 경로가 비어 있습니다. 목록 노출 또는 상담사 연결 기준이 확정되면 고객 화면을 반영합니다."
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "a"
      },
      {
        "from": "a",
        "to": "b",
        "label": "확인"
      },
      {
        "from": "a",
        "to": "h",
        "label": "법인·다계정·실패"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "b",
        "to": "h",
        "label": "API 실패"
      },
      {
        "from": "c",
        "to": "d",
        "label": "1~4건"
      },
      {
        "from": "c",
        "to": "n",
        "label": "0건"
      },
      {
        "from": "c",
        "to": "q",
        "label": "정확히 5건"
      },
      {
        "from": "c",
        "to": "h",
        "label": "5건 초과"
      },
      {
        "from": "d",
        "to": "e"
      },
      {
        "from": "e",
        "to": "f",
        "label": "주소 수정 가능"
      },
      {
        "from": "e",
        "to": "g",
        "label": "일정 수정 가능"
      },
      {
        "from": "e",
        "to": "j",
        "label": "설치마스터 전달"
      },
      {
        "from": "e",
        "to": "h",
        "label": "해당 상태 수정 불가"
      },
      {
        "from": "f",
        "to": "f",
        "label": "배송 불가 지역·재입력"
      },
      {
        "from": "f",
        "to": "k",
        "label": "주소 확인"
      },
      {
        "from": "g",
        "to": "k",
        "label": "일정 선택"
      },
      {
        "from": "g",
        "to": "h",
        "label": "가능일 없음"
      },
      {
        "from": "j",
        "to": "k"
      },
      {
        "from": "k",
        "to": "l",
        "label": "성공"
      },
      {
        "from": "k",
        "to": "h",
        "label": "실패"
      },
      {
        "from": "l",
        "to": "m"
      },
      {
        "from": "m",
        "to": "z"
      },
      {
        "from": "n",
        "to": "z"
      }
    ]
  },
  {
    "no": 18,
    "title": "고객정보 단순문의",
    "displayTitle": "고객정보 단순문의",
    "phase": "2차",
    "category": "고객정보·동의",
    "summary": "받은 연락·고객정보 문의",
    "keywords": [
      "연락 문의",
      "오연락",
      "잘못 온 연락",
      "누구에게 온 문자",
      "문자 안내",
      "모르는 연락처",
      "왜 연락했나요",
      "받은 연락 내용",
      "무슨 연락",
      "무슨 전화",
      "무슨 문자",
      "전화가 왔는데",
      "문자가 왔는데",
      "연락이 왔는데",
      "제 것이 아닌 연락",
      "다른 사람 문자",
      "잘못 온 문자",
      "제 번호 아닌데"
    ],
    "intentRules": [
      [
        [
          "전화",
          "연락",
          "문자",
          "메시지"
        ],
        [
          "무슨",
          "잘못",
          "모르는 번호",
          "받아야 할",
          "제 것이",
          "제 번호가",
          "다른 사람",
          "왜 왔",
          "왜 오는",
          "보낸 이유"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "SK매직에서 연락이 왔는데 어떤 내용인가요?",
        "message": "받으신 연락에 대해 어떤 점을 확인하고 싶으신가요?",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "origin",
        "condition": "요청 유형 선택",
        "message": "어떤 연락을 받으셨나요?",
        "kind": "choice",
        "options": [
          "배송·설치 연락",
          "계약·위약금 연락",
          "AS 안내",
          "제 것이 아닌 연락"
        ]
      },
      {
        "id": "s3",
        "stepId": "search",
        "condition": "오연락 또는 오전달",
        "message": "연락을 받으신 휴대폰 번호와 안내 내용을 알려주세요.",
        "kind": "input",
        "placeholder": "수신한 휴대폰 번호와 연락 내용"
      },
      {
        "id": "s4",
        "stepId": "limit",
        "condition": "관련 계약 있음. 공개 범위는 시·구·동 및 제품군",
        "message": "[시·구·동]의 [제품군] 관련 연락을 받으셨나요? 해당 제품을 사용 중이거나 계약자와 관계가 있으신가요?",
        "kind": "choice",
        "options": [
          "관계가 있어요",
          "관계가 없어요"
        ]
      },
      {
        "id": "s5",
        "stepId": "route",
        "condition": "업무에 맞는 고객 확인 후 연결",
        "message": "확인하신 내용을 바탕으로 [배송·설치/계약/AS] 안내를 이어갈게요.",
        "kind": "handoff"
      },
      {
        "id": "s6",
        "stepId": "deny",
        "condition": "통합고객을 특정하지 못했거나 요청 권한 확인 실패",
        "message": "입력하신 정보로는 관련 내역을 확인하기 어려워요. 연락을 받으신 번호나 안내 문구를 다시 확인해 주세요.",
        "kind": "exception",
        "options": [
          "다시 확인하기"
        ]
      },
      {
        "id": "s7",
        "stepId": "disable",
        "condition": "관계 없음 및 대체 연락처 없음. 미사용 처리 완료 응답을 받은 경우",
        "message": "잘못 전달된 연락에 사용된 번호를 미사용 처리했어요.",
        "kind": "result",
        "items": [
          {
            "title": "처리한 항목",
            "detail": "해당 연락에 사용된 수신 번호"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "need"
      },
      {
        "from": "need",
        "to": "origin"
      },
      {
        "from": "origin",
        "to": "who",
        "label": "일반 확인"
      },
      {
        "from": "origin",
        "to": "search",
        "label": "오연락·오전달"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "route",
        "label": "확인"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "실패"
      },
      {
        "from": "search",
        "to": "limit",
        "label": "조회됨"
      },
      {
        "from": "search",
        "to": "deny",
        "label": "조회 불가"
      },
      {
        "from": "limit",
        "to": "match"
      },
      {
        "from": "match",
        "to": "route",
        "label": "관계 있음"
      },
      {
        "from": "match",
        "to": "alternate",
        "label": "관계 없음"
      },
      {
        "from": "alternate",
        "to": "replace",
        "label": "있음"
      },
      {
        "from": "alternate",
        "to": "disable",
        "label": "없음"
      },
      {
        "from": "replace",
        "to": "voc"
      },
      {
        "from": "disable",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      },
      {
        "from": "route",
        "to": "end"
      }
    ],
    "demoValues": {
      "시·구·동": "서울 영등포구 문래동",
      "제품군": "직수 정수기",
      "배송·설치/계약/AS": "관련 서비스"
    }
  },
  {
    "no": 19,
    "title": "문서발송 요청_수납·미납내역서/청구서/계약서/구독계약서조회/가상계좌확인서",
    "displayTitle": "청구서·계약서 발송",
    "phase": "3차",
    "category": "문서발송",
    "summary": "청구·계약·가상계좌 관련 문서 요청",
    "keywords": [
      "청구서",
      "계약서",
      "수납내역서",
      "미납내역서",
      "가상계좌확인서",
      "계약정보확인서",
      "구독계약서",
      "청구서 다시",
      "청구서 재발급",
      "청구서 보내",
      "계약서 보내",
      "계약서 발급",
      "청구 내역",
      "납부 내역서",
      "수납 내역서",
      "계약 서류",
      "가상 계좌 확인서"
    ],
    "intentRules": [
      [
        [
          "청구서",
          "계약서",
          "수납 내역서",
          "납부 내역서",
          "계약정보확인서",
          "가상계좌 확인서"
        ],
        [
          "보내",
          "필요",
          "발송",
          "발급",
          "다시",
          "받고",
          "받을",
          "다운로드"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "form",
        "condition": "계약자 관계 및 계약 정보 확인 완료",
        "customer": "지난달 청구서를 다시 받고 싶어요.",
        "message": "어떤 문서가 필요하신가요?",
        "kind": "choice",
        "options": [
          "청구·수납 문서",
          "계약서·계약정보확인서",
          "가상계좌확인서"
        ]
      },
      {
        "id": "s2",
        "stepId": "bill",
        "condition": "청구·수납 문서 선택",
        "message": "발송할 문서와 조회 기간을 선택해 주세요. 청구서와 수납내역서는 정기 발송도 신청할 수 있어요.",
        "kind": "choice",
        "options": [
          "조건 선택하기",
          "정기 발송 가능 여부 확인"
        ]
      },
      {
        "id": "s3",
        "stepId": "receive",
        "condition": "구독계약서 선택. 알림톡은 등록된 계약자 번호",
        "message": "구독계약서는 등록된 계약자 번호로 알림톡을 보내거나 이메일로 받을 수 있어요. 어떻게 받으실까요?",
        "kind": "choice",
        "options": [
          "등록된 번호로 받기",
          "이메일로 받기"
        ]
      },
      {
        "id": "s4",
        "stepId": "receive",
        "condition": "청구·수납 문서 또는 가상계좌확인서",
        "message": "문서를 어떤 방법으로 받으실까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s5",
        "stepId": "deny",
        "condition": "계약 정보 불일치·조회 권한 없음",
        "message": "계약을 확인할 수 없어 문서를 발송하기 어려워요. 계약자 정보와 요청하신 계약을 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s6",
        "stepId": "pay",
        "condition": "발급된 가상계좌 이력 없음 및 납부 요청",
        "message": "발급된 가상계좌가 확인되지 않아요. 요금 확인과 납부 안내를 이어갈까요?",
        "kind": "handoff",
        "options": [
          "요금 납부로 이동",
          "여기서 마치기"
        ]
      },
      {
        "id": "s7",
        "stepId": "send",
        "condition": "발송 처리 성공 응답",
        "message": "요청하신 문서를 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "발송 문서",
            "detail": "[문서 이름]"
          },
          {
            "title": "수신처",
            "detail": "[마스킹된 수신처]"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "form",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "form",
        "to": "bill",
        "label": "청구·수납"
      },
      {
        "from": "form",
        "to": "contract",
        "label": "계약"
      },
      {
        "from": "form",
        "to": "account",
        "label": "가상계좌"
      },
      {
        "from": "bill",
        "to": "receive"
      },
      {
        "from": "contract",
        "to": "receive"
      },
      {
        "from": "account",
        "to": "va",
        "label": "있음"
      },
      {
        "from": "account",
        "to": "pay",
        "label": "없음·납부 요청"
      },
      {
        "from": "account",
        "to": "deny",
        "label": "없음·확인 불가"
      },
      {
        "from": "pay",
        "to": "va",
        "label": "발급 확인"
      },
      {
        "from": "pay",
        "to": "voc",
        "label": "납부 안내만"
      },
      {
        "from": "va",
        "to": "receive"
      },
      {
        "from": "receive",
        "to": "send"
      },
      {
        "from": "send",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "발송 방법": "이메일",
      "문서 이름": "청구·수납 내역서",
      "마스킹된 수신처": "de••@example.com"
    }
  },
  {
    "no": 20,
    "title": "문서발송 요청_해약위약금문의내역서/해약위약금산정내역서",
    "displayTitle": "해약 위약금 내역서 발송",
    "phase": "3차",
    "category": "문서발송",
    "summary": "해약위약금 내역서 요청",
    "keywords": [
      "해약위약금문의내역서",
      "해약위약금산정내역서",
      "위약금 내역서",
      "위약금 산정 내역",
      "위약금 내역 발송",
      "위약금 문서",
      "위약금 증빙",
      "위약금 내역서 이메일",
      "위약금 산정 내역서"
    ],
    "intentRules": [
      [
        [
          "위약금",
          "해지 비용",
          "해약비용"
        ],
        [
          "내역",
          "계산 내역",
          "산정 내역",
          "문서",
          "서류",
          "증빙",
          "팩스",
          "이메일"
        ],
        [
          "보내",
          "필요",
          "발송",
          "발급",
          "다시",
          "받고",
          "받을",
          "원해"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "위약금 내역서를 보내주세요.",
        "message": "해약위약금 내역서를 확인해 드릴게요. 요청하신 계약을 먼저 확인해 주세요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "lookup",
        "condition": "권한 확인 완료. 복수 계약이 조회된 경우",
        "message": "어떤 계약의 내역서를 받으실까요? 여러 계약을 선택하면 한 문서로 받을 수 있어요.",
        "kind": "choice",
        "options": [
          "계약 선택하기"
        ]
      },
      {
        "id": "s3",
        "stepId": "before",
        "condition": "해약 신청 전. 문의내역서 산정에 필요한 항목",
        "message": "해약을 신청하기 전에는 문의내역서를 받아보실 수 있어요. 해약 사유와 제품 회수를 원하시는 날짜를 알려주세요.",
        "kind": "input",
        "placeholder": "해약 사유 · 희망 회수일"
      },
      {
        "id": "s4",
        "stepId": "channel",
        "condition": "해약 신청 후. 산정내역서 선택",
        "message": "접수하신 해약의 위약금 산정내역서를 보낼 수 있어요. 어떤 방법으로 받으실까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s5",
        "stepId": "deny",
        "condition": "요청 권한 없음 또는 계약 확인 실패",
        "message": "계약이 확인되지 않아 내역서를 발송하기 어려워요. 계약자 정보와 대상 계약을 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s6",
        "stepId": "send",
        "condition": "문서 발송 성공 응답",
        "message": "요청하신 [위약금 내역서 종류]를 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "대상 계약",
            "detail": "[선택한 계약]"
          },
          {
            "title": "발송 방법",
            "detail": "[알림톡·이메일·팩스]"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "lookup",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "lookup",
        "to": "state"
      },
      {
        "from": "state",
        "to": "before",
        "label": "신청 전"
      },
      {
        "from": "state",
        "to": "after",
        "label": "신청 후"
      },
      {
        "from": "before",
        "to": "print"
      },
      {
        "from": "after",
        "to": "print"
      },
      {
        "from": "print",
        "to": "channel"
      },
      {
        "from": "channel",
        "to": "send"
      },
      {
        "from": "send",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "위약금 내역서 종류": "해약 위약금 산정 내역서",
      "발송 방법": "이메일",
      "선택한 계약": "직수 정수기 · WPU-1000",
      "알림톡·이메일·팩스": "이메일"
    }
  },
  {
    "no": 21,
    "title": "문서발송 요청_해약확인서",
    "displayTitle": "해약확인서 발송",
    "phase": "3차",
    "category": "문서발송",
    "summary": "해약확인서 발송 요청",
    "keywords": [
      "해약확인서",
      "해지 확인서",
      "구독 해지 증명서",
      "해약 서류",
      "해약 증명",
      "해지 증명",
      "해약 내역서 말고",
      "해지는 됐는데 확인서",
      "해지확인서 보내"
    ],
    "intentRules": [
      [
        [
          "해약",
          "해지"
        ],
        [
          "확인서",
          "증명서",
          "증명하는",
          "증빙",
          "사실"
        ],
        [
          "보내",
          "필요",
          "발송",
          "발급",
          "다시",
          "받고",
          "받을",
          "원해"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "해약확인서를 받고 싶어요.",
        "message": "해약확인서를 발급할 수 있는지 회수와 해약 상태를 확인해 드릴게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "channel",
        "condition": "해약 확정 및 계약 확인 완료",
        "message": "해약이 확정되어 확인서를 받을 수 있어요. 어떤 방법으로 보내드릴까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s3",
        "stepId": "next",
        "condition": "제품 회수 완료. 해약 확정 전. 익일 재확인은 상담이관",
        "message": "제품은 회수됐고 해약 확정은 아직 전산에 반영되지 않았어요. 내일 확정 상태를 확인한 뒤 발송할 수 있도록 상담 담당자에게 전달할게요.",
        "kind": "handoff"
      },
      {
        "id": "s4",
        "stepId": "wait",
        "condition": "제품 회수 전",
        "message": "해약확인서는 제품 회수와 해약 확정이 끝난 뒤 발급할 수 있어요. 제품을 반납하신 다음 날에 다시 요청해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s5",
        "stepId": "deny",
        "condition": "계약 확인 실패 또는 권한 없음",
        "message": "요청하신 계약을 확인하지 못했어요. 계약자 정보와 해약한 제품을 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s6",
        "stepId": "send",
        "condition": "해약확인서 발송 성공 응답",
        "message": "해약확인서를 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "수신처",
            "detail": "[마스킹된 수신처]"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "lookup",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "lookup",
        "to": "confirmed"
      },
      {
        "from": "confirmed",
        "to": "channel",
        "label": "확정"
      },
      {
        "from": "confirmed",
        "to": "returned",
        "label": "미확정"
      },
      {
        "from": "returned",
        "to": "next",
        "label": "회수 완료"
      },
      {
        "from": "returned",
        "to": "wait",
        "label": "회수 전"
      },
      {
        "from": "channel",
        "to": "send"
      },
      {
        "from": "send",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "wait",
        "to": "voc"
      },
      {
        "from": "next",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "발송 방법": "이메일",
      "마스킹된 수신처": "de••@example.com"
    }
  },
  {
    "no": 22,
    "title": "문서발송 요청_서비스처리내역확인서",
    "displayTitle": "서비스처리내역확인서 발송",
    "phase": "3차",
    "category": "문서발송",
    "summary": "서비스 처리내역 확인서 요청",
    "keywords": [
      "서비스처리내역확인서",
      "AS 처리 내역",
      "수리 내역서",
      "서비스 처리 내역 문서",
      "AS 내역서",
      "점검 결과서",
      "수리 확인서",
      "방문 서비스 확인서",
      "고장 수리 내역",
      "서비스 처리 확인서",
      "수리 처리 내용 문서"
    ],
    "intentRules": [
      [
        [
          "AS",
          "수리",
          "서비스 처리",
          "점검 내역"
        ],
        [
          "내역",
          "내역서",
          "확인서",
          "증빙",
          "문서"
        ],
        [
          "보내",
          "필요",
          "발송",
          "발급",
          "다시",
          "받아",
          "받고",
          "받을",
          "원해"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "지난번 AS 처리 내역을 문서로 받고 싶어요.",
        "message": "서비스처리내역확인서를 보내드릴게요. 먼저 어떤 서비스였는지 확인해 주세요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "applicant",
        "condition": "일반 서비스. 계약 기반 구독·멤버십과 구별",
        "message": "서비스를 신청할 때 사용한 휴대폰 번호와 이름, 서비스 주소를 알려주세요.",
        "kind": "input",
        "placeholder": "서비스를 신청했던 정보"
      },
      {
        "id": "s3",
        "stepId": "form",
        "condition": "서비스 대상 확인 완료",
        "message": "어떤 서비스의 처리 내역인가요? 서비스 종류와 처리 기간을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "일반 AS",
          "재설치",
          "분리",
          "필터 서비스"
        ]
      },
      {
        "id": "s4",
        "stepId": "channel",
        "condition": "문서 발송 조건 확정",
        "message": "서비스처리내역확인서를 어떤 방법으로 받으실까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s5",
        "stepId": "deny",
        "condition": "계약·신청 정보 확인 실패 또는 권한 없음",
        "message": "입력하신 정보로는 서비스 대상을 확인하지 못했어요. 신청하셨을 때의 정보와 서비스 주소를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s6",
        "stepId": "send",
        "condition": "발송 성공 응답",
        "message": "서비스처리내역확인서를 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 종류",
            "detail": "[선택한 서비스]"
          },
          {
            "title": "조회 기간",
            "detail": "[시작일]~[종료일]"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "type"
      },
      {
        "from": "type",
        "to": "who",
        "label": "구독·멤버십"
      },
      {
        "from": "type",
        "to": "applicant",
        "label": "일반 서비스"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "applicant",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "list",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "list",
        "to": "form"
      },
      {
        "from": "form",
        "to": "channel"
      },
      {
        "from": "channel",
        "to": "send"
      },
      {
        "from": "send",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "발송 방법": "이메일",
      "선택한 서비스": "직수 정수기 점검",
      "시작일": "2026년 11월 1일",
      "종료일": "2026년 11월 25일"
    }
  },
  {
    "no": 23,
    "title": "문서발송 요청_카드매출전표/카드영수증",
    "displayTitle": "카드 영수증·매출전표 발송",
    "phase": "3차",
    "category": "문서발송",
    "summary": "카드매출전표·카드영수증 요청",
    "keywords": [
      "카드 영수증",
      "카드매출전표",
      "카드결제 증빙",
      "카드 결제한 영수증",
      "신용카드 영수증",
      "신용카드 전표",
      "카드 전표",
      "카드 매출 전표",
      "카드 납부 영수증",
      "카드 영수증 이메일",
      "카드 영수증 재발급"
    ],
    "intentRules": [
      [
        [
          "카드",
          "신용카드",
          "체크카드",
          "매출 전표",
          "카드 전표"
        ],
        [
          "영수증",
          "매출 전표",
          "증빙",
          "전표"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "카드로 결제한 영수증 좀 보내주세요.",
        "message": "영수증을 찾을 수 있도록 계약과 카드 결제 내역을 먼저 확인할게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "type",
        "condition": "카드결제 이력 조회 성공",
        "message": "어떤 서류가 필요하신가요?",
        "kind": "choice",
        "options": [
          "카드영수증",
          "카드매출전표"
        ]
      },
      {
        "id": "s3",
        "stepId": "receiver",
        "condition": "OASYS 카드영수증 발송 경로",
        "message": "카드영수증을 어떤 방법으로 받으실까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s4",
        "stepId": "easy",
        "condition": "이지페이 발송이 필요한 카드매출전표. 상담이관",
        "message": "카드매출전표 발송은 담당자가 확인해 드려요. 원하시는 수신 방법을 선택하시면 요청과 함께 전달할게요.",
        "kind": "handoff",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s5",
        "stepId": "missing",
        "condition": "카드결제 이력 조회 결과 없음",
        "message": "선택하신 계약과 기간에 카드 결제 내역이 조회되지 않아요. 결제하신 달이나 대상 계약을 바꿔 확인해 주세요.",
        "kind": "exception",
        "options": [
          "조회 조건 변경"
        ]
      },
      {
        "id": "s6",
        "stepId": "deny",
        "condition": "계약 확인 실패 또는 권한 없음",
        "message": "계약을 확인하지 못해 영수증을 조회하기 어려워요. 계약자 정보와 결제한 계약을 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s7",
        "stepId": "send",
        "condition": "카드영수증 발송 성공 응답",
        "message": "카드영수증을 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "조회 기간",
            "detail": "[조회 기간]"
          },
          {
            "title": "수신처",
            "detail": "[마스킹된 수신처]"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "list",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "list",
        "to": "found"
      },
      {
        "from": "found",
        "to": "type",
        "label": "있음"
      },
      {
        "from": "found",
        "to": "missing",
        "label": "없음"
      },
      {
        "from": "type",
        "to": "receiver",
        "label": "카드영수증"
      },
      {
        "from": "type",
        "to": "easy",
        "label": "카드매출전표"
      },
      {
        "from": "receiver",
        "to": "send"
      },
      {
        "from": "send",
        "to": "voc"
      },
      {
        "from": "missing",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "easy",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "발송 방법": "이메일",
      "조회 기간": "2026년 11월 결제분",
      "마스킹된 수신처": "de••@example.com"
    }
  },
  {
    "no": 24,
    "title": "수납정보관련_지로/가상계좌 재발송 · 지로 발송 확인 (통합)",
    "displayTitle": "지로·가상계좌 재발송",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "지로 발송 확인·재발송 또는 가상계좌 요청",
    "keywords": [
      "지로 재발송",
      "지로 발송 확인",
      "지로 고지서",
      "가상계좌 재발송",
      "고지서 재발급",
      "고지서 안 왔",
      "고지서가 안 왔",
      "지로 안 왔",
      "지로 발송일",
      "지로 다시",
      "지로 고지서 재발급",
      "가상계좌 다시 보내",
      "지로 발송 내역"
    ],
    "intentRules": [
      [
        [
          "지로",
          "납부 고지서",
          "가상계좌 확인서"
        ],
        [
          "못 받았",
          "안 왔",
          "재발송",
          "재발급",
          "다시",
          "발송일",
          "발송 내역",
          "보내 줘"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "intent",
        "condition": "권한 및 대상 계약 확인 후 요청 유형 선택",
        "customer": "지로 고지서가 이번 달에 안 왔어요.",
        "message": "어떤 내용을 확인해 드릴까요?",
        "kind": "choice",
        "options": [
          "지로 발송 내역",
          "지로 고지서 다시 받기",
          "가상계좌확인서 받기"
        ]
      },
      {
        "id": "s2",
        "stepId": "who",
        "condition": "법인 사업자번호로 조회 실패한 경우",
        "message": "지로 고지서에 적힌 전자납부번호(고객번호) 6자리를 알려주세요. 그 번호로 관련 계약을 확인해 볼게요.",
        "kind": "input",
        "placeholder": "전자납부번호 6자리"
      },
      {
        "id": "s3",
        "stepId": "status",
        "condition": "법인 지로 발급 수량 및 수령 정보 조회 완료",
        "message": "조회한 지로 발급 내역이에요.",
        "kind": "result",
        "items": [
          {
            "title": "발급 수량",
            "detail": "[발급 건수]"
          },
          {
            "title": "고지서 수령 방법",
            "detail": "[우편 또는 이메일]"
          }
        ]
      },
      {
        "id": "s4",
        "stepId": "receipt",
        "condition": "지로 납부 계약이며 1회 재발송 대상",
        "message": "지로 고지서 이미지를 어떤 방법으로 보내드릴까요?",
        "kind": "choice",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ]
      },
      {
        "id": "s5",
        "stepId": "image",
        "condition": "고지서 이미지 재발송 성공 응답",
        "message": "지로 고지서 이미지를 [발송 방법]으로 보냈어요. 이미지에 적힌 전자납부번호 또는 가상계좌로 납부하실 수 있어요.",
        "kind": "result"
      },
      {
        "id": "s6",
        "stepId": "statement",
        "condition": "기존 고정형 가상계좌확인서 발송 성공 응답",
        "message": "기존 가상계좌가 적힌 확인서를 [발송 방법]으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "수신처",
            "detail": "[마스킹된 수신처]"
          }
        ]
      },
      {
        "id": "s7",
        "stepId": "new",
        "condition": "기발급 고정형 가상계좌 없음. 신규 발급 연계는 검토 중",
        "message": "기존 가상계좌가 조회되지 않아요. 요금 납부 방법을 확인해 드릴까요?",
        "kind": "handoff",
        "options": [
          "납부 방법 확인"
        ]
      },
      {
        "id": "s8",
        "stepId": "deny",
        "condition": "지로 발송 비대상 또는 계약 조회 실패",
        "message": "요청하신 계약의 지로 발송 내역을 확인할 수 없어요. 현재 등록된 납부 방법이나 고지서에 적힌 번호를 확인해 주세요.",
        "kind": "exception"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "intent",
        "label": "확인"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "미확인"
      },
      {
        "from": "intent",
        "to": "giro",
        "label": "지로"
      },
      {
        "from": "intent",
        "to": "fixed",
        "label": "가상계좌"
      },
      {
        "from": "giro",
        "to": "need"
      },
      {
        "from": "need",
        "to": "receipt",
        "label": "발송 대상"
      },
      {
        "from": "need",
        "to": "status",
        "label": "단순 확인"
      },
      {
        "from": "need",
        "to": "deny",
        "label": "대상 아님"
      },
      {
        "from": "receipt",
        "to": "image"
      },
      {
        "from": "fixed",
        "to": "statement",
        "label": "예"
      },
      {
        "from": "fixed",
        "to": "new",
        "label": "신규 발급 필요"
      },
      {
        "from": "image",
        "to": "voc"
      },
      {
        "from": "status",
        "to": "voc"
      },
      {
        "from": "statement",
        "to": "voc"
      },
      {
        "from": "new",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "발급 건수": "1건",
      "우편 또는 이메일": "이메일",
      "발송 방법": "이메일",
      "마스킹된 수신처": "de••@example.com"
    }
  },
  {
    "no": 25,
    "title": "수납정보관련_통합/분리 결제(지로)",
    "displayTitle": "지로 통합·분리",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "지로를 통합 또는 분리해 달라는 요청",
    "keywords": [
      "지로 통합",
      "지로 분리",
      "지로 합치기",
      "지로 한 장",
      "지로 통합발행",
      "지로 분리발행",
      "지로 한 번에",
      "지로 하나로",
      "지로 따로",
      "지로 고지서 두 장",
      "지로별로 나눠",
      "지로 고지서 한 장으로",
      "지로 합쳐"
    ],
    "intentRules": [
      [
        [
          "지로 고지서",
          "지로",
          "고지서"
        ],
        [
          "통합",
          "분리",
          "합치",
          "합칠",
          "합쳐",
          "나눠",
          "나누",
          "한 장",
          "따로",
          "두 장"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입. 담당·이관 기준 미확정",
        "customer": "지로를 통합해서 한 장으로 받을 수 있을까요?",
        "message": "지로 고지서를 합치거나 나눠 받는 요청이군요. 대상 계약이 지로 납부 중인지 먼저 확인할게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "op",
        "condition": "법인 지로 대상 확인 후 고객 의사 수집",
        "message": "어떤 방식으로 고지서를 받고 싶으신가요?",
        "kind": "choice",
        "options": [
          "한 장으로 받기",
          "계약별로 나눠 받기"
        ]
      },
      {
        "id": "s3",
        "stepId": "deny",
        "condition": "법인 지로 납부 대상 아님 또는 권한 확인 실패",
        "message": "확인하신 계약은 지로 고지서 통합이나 분리 대상이 아니에요. 계약과 현재 납부 방법을 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s4",
        "stepId": "align",
        "condition": "대상 계약 납부정보가 다름. 변경 의사 확인",
        "message": "선택하신 계약의 결제 정보가 모두 같아야 고지서를 합칠 수 있어요. 결제정보 변경 안내를 먼저 보시겠어요?",
        "kind": "handoff",
        "options": [
          "결제정보 변경 안내",
          "여기서 마치기"
        ]
      },
      {
        "id": "s5",
        "stepId": "notify",
        "condition": "동일 결제정보 또는 분리 대상 확정. 적용 성공 안내가 아님",
        "message": "고지서가 통합되거나 분리되면 다음 달부터 적용돼요. 고지서를 어떤 방법으로 받고 싶으신가요?",
        "kind": "choice",
        "options": [
          "우편",
          "이메일"
        ]
      },
      {
        "id": "s6",
        "stepId": "owner",
        "condition": "해당 업무 담당 및 상담이관 여부 미확정. 자동 처리 경로 미구현",
        "message": "이 요청은 담당 업무 확인이 필요해요. 상담을 이어가시겠어요?",
        "kind": "handoff",
        "options": [
          "상담 문의하기"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "owner",
        "label": "대상"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "미대상"
      },
      {
        "from": "owner",
        "to": "op",
        "label": "담당 처리 경로 검토"
      },
      {
        "from": "owner",
        "to": "end",
        "label": "담당 미확정"
      },
      {
        "from": "op",
        "to": "same",
        "label": "통합"
      },
      {
        "from": "op",
        "to": "split",
        "label": "분리"
      },
      {
        "from": "same",
        "to": "group",
        "label": "동일"
      },
      {
        "from": "same",
        "to": "align",
        "label": "상이"
      },
      {
        "from": "align",
        "to": "group",
        "label": "일치화 완료"
      },
      {
        "from": "align",
        "to": "voc",
        "label": "취소·불가"
      },
      {
        "from": "group",
        "to": "notify"
      },
      {
        "from": "split",
        "to": "notify"
      },
      {
        "from": "notify",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ]
  },
  {
    "no": 26,
    "title": "수납정보관련_통합 결제(CMS/카드/가상계좌)",
    "displayTitle": "결제 통합",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "여러 계약의 결제를 합쳐 달라는 요청",
    "keywords": [
      "통합 결제",
      "결제 통합",
      "결제를 한 번으로",
      "구독료 묶기",
      "합산납부",
      "결제를 합치기",
      "결제 합쳐",
      "한번에 출금",
      "한 번에 출금",
      "한번에 납부",
      "한 번에 납부",
      "한 건으로 결제",
      "합쳐서 결제",
      "여러 계약 한번에",
      "결제를 하나로",
      "요금 결제 묶어"
    ],
    "intentRules": [
      [
        [
          "결제",
          "출금",
          "납부",
          "빼가",
          "계약"
        ],
        [
          "통합",
          "묶어",
          "한 번에",
          "하나로",
          "합산",
          "같이",
          "합쳐",
          "합치"
        ],
        [
          "여러",
          "각 계약",
          "각 제품",
          "두 개",
          "2개",
          "정수기하고",
          "공청기",
          "여러 계약",
          "두 건",
          "묶어",
          "합쳐"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "매달 두 번 나가는 결제를 한 번으로 합치고 싶어요.",
        "message": "통합할 계약을 확인해 드릴게요. 같은 결제 정보가 등록된 계약끼리 결제를 합칠 수 있어요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "items",
        "condition": "요청 권한 확인 완료. 대상 계약 조회 성공",
        "message": "어떤 계약의 결제를 합치실까요? 통합 대상으로 묶을 계약과 대표 계약을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "계약 선택하기"
        ]
      },
      {
        "id": "s3",
        "stepId": "warn",
        "condition": "선택 계약에 당일 결제 시도 건 있음",
        "message": "오늘은 결제 시도일이라 기존 방식으로 요금이 결제될 수 있어요. 그래도 통합 요청을 계속할까요?",
        "kind": "choice",
        "options": [
          "계속하기",
          "여기서 마치기"
        ]
      },
      {
        "id": "s4",
        "stepId": "align",
        "condition": "선택한 계약의 결제 정보가 서로 다름",
        "message": "선택하신 계약의 결제 정보가 서로 달라요. 결제 정보를 먼저 맞추거나 통합할 계약을 다시 선택할 수 있어요.",
        "kind": "handoff",
        "options": [
          "결제정보 변경",
          "계약 다시 선택"
        ]
      },
      {
        "id": "s5",
        "stepId": "proof",
        "condition": "대상·대표 계약 확인. 증빙 일괄 적용 가능 여부 확인",
        "message": "증빙 발행 정보도 대표 계약과 동일하게 바꾸실까요?",
        "kind": "choice",
        "options": [
          "증빙 정보도 변경",
          "결제만 통합"
        ]
      },
      {
        "id": "s6",
        "stepId": "deny",
        "condition": "계약 조회 실패 또는 권한 없음",
        "message": "요청하신 계약 정보가 확인되지 않아 결제를 통합하기 어려워요. 계약자나 납부자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s7",
        "stepId": "group",
        "condition": "통합 대상 및 대표 선택. 묶음 저장 성공 응답",
        "message": "선택하신 계약의 결제를 묶었어요.",
        "kind": "result",
        "items": [
          {
            "title": "대표 계약",
            "detail": "[제품·계약 식별 표시]"
          },
          {
            "title": "통합 대상",
            "detail": "[선택한 계약 수]"
          }
        ]
      },
      {
        "id": "E7",
        "stepId": "giron",
        "condition": "지로 결제 계약",
        "message": "지로로 납부 중인 계약의 결제 통합은 지로 통합·분리 메뉴에서 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "지로 통합·분리 안내"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "giro",
        "label": "확인"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "미확인"
      },
      {
        "from": "giro",
        "to": "giron",
        "label": "지로"
      },
      {
        "from": "giro",
        "to": "items",
        "label": "CMS·카드·가상계좌"
      },
      {
        "from": "items",
        "to": "day"
      },
      {
        "from": "day",
        "to": "warn",
        "label": "결제 시도일"
      },
      {
        "from": "day",
        "to": "same",
        "label": "그 외"
      },
      {
        "from": "warn",
        "to": "same"
      },
      {
        "from": "same",
        "to": "group",
        "label": "동일"
      },
      {
        "from": "same",
        "to": "align",
        "label": "상이"
      },
      {
        "from": "align",
        "to": "same",
        "label": "변경 완료 또는 대상 재선택"
      },
      {
        "from": "align",
        "to": "voc",
        "label": "중단"
      },
      {
        "from": "group",
        "to": "proof"
      },
      {
        "from": "proof",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "giron",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "제품·계약 식별 표시": "직수 정수기 · WPU-1000",
      "선택한 계약 수": "2건"
    }
  },
  {
    "no": 27,
    "title": "수납정보관련_분리 결제(CMS/카드/가상계좌)",
    "displayTitle": "결제 분리",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "묶인 결제를 분리해 달라는 요청",
    "keywords": [
      "분리 결제",
      "결제 분리",
      "제품별로 결제",
      "계약별로 결제",
      "결제 묶음 풀기",
      "결제 나누기",
      "결제 따로",
      "따로 납부",
      "각각 출금",
      "따로 출금",
      "묶음 결제 해제",
      "통합 결제 풀어",
      "결제 묶음 분리",
      "제품별 따로 결제"
    ],
    "intentRules": [
      [
        [
          "결제",
          "출금",
          "납부",
          "요금"
        ],
        [
          "나눠",
          "나누",
          "풀어",
          "따로",
          "각각",
          "분리",
          "해제"
        ],
        [
          "계약",
          "제품",
          "묶",
          "통합",
          "합산",
          "별로"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "하나로 묶인 결제를 제품별로 나누고 싶어요.",
        "message": "묶여 있는 결제 중 어떤 계약을 분리하실지 확인해 드릴게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "mode",
        "condition": "권한 확인 및 계약 묶음 조회 성공",
        "message": "어떤 방식으로 나누실까요?",
        "kind": "choice",
        "options": [
          "모든 계약을 나누기",
          "일부 계약만 나누기"
        ]
      },
      {
        "id": "s3",
        "stepId": "warn",
        "condition": "당일 결제 시도일",
        "message": "오늘 결제는 기존에 등록된 정보로 진행될 수 있어요. 분리 요청을 계속할까요?",
        "kind": "choice",
        "options": [
          "계속하기",
          "여기서 마치기"
        ]
      },
      {
        "id": "s4",
        "stepId": "some",
        "condition": "일부 분리 선택. 저장 요청 이전",
        "message": "기존 묶음에서 분리할 계약을 선택해 주세요.",
        "kind": "choice",
        "options": [
          "분리할 계약 선택"
        ]
      },
      {
        "id": "s5",
        "stepId": "all",
        "condition": "대표 계약 전체 풀기 저장 성공",
        "message": "대표 계약에 묶였던 결제를 모두 분리했어요.",
        "kind": "result",
        "items": [
          {
            "title": "분리 계약",
            "detail": "[전체 계약 수]"
          }
        ]
      },
      {
        "id": "s6",
        "stepId": "some",
        "condition": "일부 분리 저장 성공",
        "message": "선택하신 계약을 기존 결제 묶음에서 분리했어요.",
        "kind": "result",
        "items": [
          {
            "title": "분리한 계약",
            "detail": "[선택한 계약]"
          }
        ]
      },
      {
        "id": "s7",
        "stepId": "deny",
        "condition": "계약·납부자 확인 불가",
        "message": "요청하신 계약의 결제 묶음을 확인하지 못했어요. 계약자나 납부자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "E7",
        "stepId": "giron",
        "condition": "지로 결제 계약",
        "message": "지로로 납부 중인 계약의 결제 분리는 지로 통합·분리 메뉴에서 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "지로 통합·분리 안내"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "giro",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "giro",
        "to": "giron",
        "label": "지로"
      },
      {
        "from": "giro",
        "to": "list",
        "label": "CMS·카드·가상계좌"
      },
      {
        "from": "list",
        "to": "day"
      },
      {
        "from": "day",
        "to": "warn",
        "label": "결제 시도일"
      },
      {
        "from": "day",
        "to": "mode",
        "label": "그 외"
      },
      {
        "from": "warn",
        "to": "mode"
      },
      {
        "from": "mode",
        "to": "all",
        "label": "전체"
      },
      {
        "from": "mode",
        "to": "some",
        "label": "일부"
      },
      {
        "from": "all",
        "to": "voc"
      },
      {
        "from": "some",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "giron",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "전체 계약 수": "2건",
      "선택한 계약": "공기청정기 · ACL-1000"
    }
  },
  {
    "no": 28,
    "title": "고객정보관련_고객정보수정",
    "displayTitle": "고객정보 수정",
    "phase": "2차",
    "category": "고객정보·동의",
    "summary": "계약자·사용자 정보 변경 요청",
    "keywords": [
      "고객정보 변경",
      "고객정보수정",
      "연락처 변경",
      "전화번호 변경",
      "주소 변경",
      "계약자 휴대폰 변경",
      "사용자 정보 변경",
      "이메일 변경",
      "개명",
      "연락처 바꾸",
      "휴대폰 번호 바꾸",
      "번호가 바뀌",
      "집 주소 변경",
      "이사해서 주소",
      "등록된 주소 변경",
      "사용자 바꾸",
      "이메일 주소 바꾸",
      "상호를 변경",
      "대표자 변경"
    ],
    "intentRules": [
      [
        [
          "전화번호",
          "휴대폰",
          "연락처",
          "주소",
          "이메일",
          "상호",
          "대표자",
          "사용자",
          "개명"
        ],
        [
          "바뀌",
          "바꾸",
          "바꿀",
          "바꿔",
          "변경",
          "새로운",
          "옮기",
          "수정"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "change",
        "condition": "요청 관계와 계약 정보 확인 완료",
        "customer": "정수기 쓰는 주소랑 휴대폰 번호를 바꾸고 싶어요.",
        "message": "어떤 정보를 변경하실까요?",
        "kind": "choice",
        "options": [
          "계약자 휴대폰",
          "주소·사용자 정보",
          "계산서 수신 이메일",
          "개명·대표자·상호"
        ]
      },
      {
        "id": "s2",
        "stepId": "auth",
        "condition": "계약자 휴대폰 변경 · 새 번호로 PASS",
        "message": "계약자 휴대폰 번호를 바꾸려면 새 번호로 PASS 본인인증을 진행해 주세요.",
        "kind": "choice",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "passRetry",
        "stepId": "deny",
        "condition": "계약자 휴대폰 변경 · PASS 본인인증 실패",
        "message": "PASS 본인인증을 완료하지 못했어요. 변경할 번호가 계약자 본인 명의인지 확인한 뒤 다시 시도해 주세요.",
        "kind": "exception",
        "options": [
          "PASS 다시 시도"
        ]
      },
      {
        "id": "s3",
        "stepId": "deny",
        "condition": "계약 정보 또는 요청 권한 확인 불가",
        "message": "계약자 정보를 확인하지 못했어요. 등록된 정보를 확인한 뒤 다시 시도해 주세요.",
        "kind": "exception",
        "options": [
          "다시 확인하기"
        ]
      },
      {
        "id": "s4",
        "stepId": "email",
        "condition": "세금계산서 수신 이메일 변경 선택. 저장 전",
        "message": "세금계산서를 받으실 새 이메일 주소를 입력해 주세요.",
        "kind": "input",
        "placeholder": "새 수신 이메일 주소"
      },
      {
        "id": "s5",
        "stepId": "documents",
        "condition": "증빙 서류가 필요한 개명·대표자·상호 변경",
        "message": "요청하신 변경에는 서류 확인이 필요해요. 담당자가 필요한 서류와 제출 방법을 안내해 드려요.",
        "kind": "handoff",
        "options": [
          "상담 문의하기"
        ]
      },
      {
        "id": "s6",
        "stepId": "linked",
        "condition": "주소 변경과 함께 제품 재설치 요청",
        "message": "제품을 옮겨서 다시 설치하셔야 하나요? 주소 변경과 별도로 재설치 접수 안내를 도와드릴게요.",
        "kind": "handoff",
        "options": [
          "재설치 접수 안내"
        ]
      },
      {
        "id": "s7",
        "stepId": "save",
        "condition": "일반 고객정보 변경 저장 성공",
        "message": "요청하신 [변경 항목]을 변경했어요.",
        "kind": "result",
        "items": [
          {
            "title": "변경 항목",
            "detail": "[연락처·주소·사용자 정보]"
          }
        ]
      },
      {
        "id": "s8",
        "stepId": "resenddoc",
        "condition": "이메일 변경 후 재발송 요청. 별도 문서발송 업무",
        "message": "이미 발행된 세금계산서도 새 이메일로 받고 싶으신가요? 재발송 안내를 이어갈 수 있어요.",
        "kind": "handoff",
        "options": [
          "재발송 안내",
          "여기서 마치기"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "change",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "change",
        "to": "auth",
        "label": "계약자 휴대폰"
      },
      {
        "from": "change",
        "to": "documents",
        "label": "개명·대표자·상호"
      },
      {
        "from": "change",
        "to": "linked",
        "label": "명의변경·연계 작업 필요"
      },
      {
        "from": "change",
        "to": "email",
        "label": "세금계산서 수신 이메일"
      },
      {
        "from": "change",
        "to": "save",
        "label": "주소·사용자·유선전화"
      },
      {
        "from": "auth",
        "to": "save",
        "label": "성공"
      },
      {
        "from": "auth",
        "to": "deny",
        "label": "실패"
      },
      {
        "from": "email",
        "to": "resend"
      },
      {
        "from": "resend",
        "to": "resenddoc",
        "label": "요청"
      },
      {
        "from": "resend",
        "to": "voc",
        "label": "미요청"
      },
      {
        "from": "save",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "documents",
        "to": "end"
      },
      {
        "from": "linked",
        "to": "end"
      },
      {
        "from": "resenddoc",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "변경 항목": "연락처",
      "연락처·주소·사용자 정보": "휴대폰 010-••••-1234"
    }
  },
  {
    "no": 29,
    "title": "안심OK 단순문의_셀프형 필터배송확인",
    "displayTitle": "안심OK 필터 배송 확인",
    "phase": "3차",
    "category": "AS·케어",
    "summary": "안심OK 셀프형 필터 배송 문의",
    "keywords": [
      "안심OK 필터",
      "필터 배송",
      "필터 안 왔어요",
      "셀프형 필터",
      "필터 택배",
      "필터 배송 조회",
      "필터 언제 오",
      "필터가 안 왔",
      "필터가 안 도착",
      "필터가 출고",
      "필터 배송 주소",
      "안심 OK 필터"
    ],
    "intentRules": [
      [
        [
          "필터"
        ],
        [
          "배송",
          "출고",
          "택배",
          "언제",
          "안 와",
          "안 왔",
          "받을",
          "못 받",
          "도착"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "third",
        "condition": "필터 배송 업무 진입",
        "customer": "안심OK 필터가 아직 안 왔어요.",
        "message": "어떤 배송을 확인해 드릴까요?",
        "kind": "choice",
        "options": [
          "제 필터 배송",
          "다른 분의 택배를 받았어요"
        ]
      },
      {
        "id": "s2",
        "stepId": "plan",
        "condition": "배송 예정월·일정 조회 성공",
        "message": "조회된 안심OK 필터 배송 예정 정보예요.",
        "kind": "result",
        "items": [
          {
            "title": "배송 예정",
            "detail": "[예정 월 또는 날짜]"
          },
          {
            "title": "배송 주소",
            "detail": "[마스킹된 주소]"
          }
        ]
      },
      {
        "id": "s3",
        "stepId": "carrier",
        "condition": "출고 완료·택배 배송완료 표기 후 미수령",
        "message": "택배가 출고된 상태예요. 배송완료 안내를 받고도 물품을 받지 못하셨다면 [택배사]에서 배송 위치나 인수 내역을 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "택배사 확인"
        ]
      },
      {
        "id": "s4",
        "stepId": "address",
        "condition": "오배송·파손 확인 과정에서 배송지 변경 여부 수집",
        "message": "필터를 받을 주소가 [마스킹된 주소]로 확인돼요. 주소를 바꾸시겠어요?",
        "kind": "choice",
        "options": [
          "기존 주소 사용",
          "배송지 변경"
        ]
      },
      {
        "id": "s5",
        "stepId": "resend",
        "condition": "재발송 필요 판단과 재발송 접수 성공",
        "message": "안심OK 필터 재발송을 접수했어요.",
        "kind": "result",
        "items": [
          {
            "title": "받으실 주소",
            "detail": "[마스킹된 주소]"
          }
        ]
      },
      {
        "id": "s6",
        "stepId": "thirdloc",
        "condition": "타인 물품 오배송 확인",
        "message": "다른 분의 택배를 받으셨다면 회수 확인에 필요한 배송 주소와 연락처를 알려주세요.",
        "kind": "input",
        "placeholder": "택배를 받은 주소와 연락처"
      },
      {
        "id": "s7",
        "stepId": "return",
        "condition": "타인 택배 회수 요청. 협력사 전달 전",
        "message": "입력하신 내용으로 회수를 요청할 수 있도록 담당자에게 전달할게요.",
        "kind": "handoff"
      },
      {
        "id": "s8",
        "stepId": "deny",
        "condition": "대상 계약·배송 확인 불가",
        "message": "입력하신 정보로는 필터 배송 내역을 확인할 수 없어요. 제품을 사용하시는 주소와 연락처를 다시 확인해 주세요.",
        "kind": "exception"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "third"
      },
      {
        "from": "third",
        "to": "thirdloc",
        "label": "타인 택배"
      },
      {
        "from": "third",
        "to": "who",
        "label": "본인 배송"
      },
      {
        "from": "thirdloc",
        "to": "return"
      },
      {
        "from": "return",
        "to": "voc"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "lookup",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "lookup",
        "to": "issue"
      },
      {
        "from": "issue",
        "to": "plan",
        "label": "예정·일반 확인"
      },
      {
        "from": "issue",
        "to": "carrier",
        "label": "출고 후 미수령"
      },
      {
        "from": "issue",
        "to": "address",
        "label": "오배송·파손·주소 변경"
      },
      {
        "from": "plan",
        "to": "voc"
      },
      {
        "from": "carrier",
        "to": "voc"
      },
      {
        "from": "address",
        "to": "update",
        "label": "필요"
      },
      {
        "from": "address",
        "to": "resend",
        "label": "주소 정상·재발송 대상"
      },
      {
        "from": "update",
        "to": "resend",
        "label": "재발송 필요"
      },
      {
        "from": "update",
        "to": "voc",
        "label": "주소 변경만"
      },
      {
        "from": "resend",
        "to": "voc"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "예정 월 또는 날짜": "2026년 12월 2일(수)",
      "마스킹된 주소": "서울 영등포구 문래동 •••",
      "택배사": "예시 택배"
    }
  },
  {
    "no": 30,
    "title": "안심OK 단순문의_접수/일정/방문 확인",
    "displayTitle": "안심OK 방문 일정 확인",
    "phase": "2차",
    "category": "AS·케어",
    "summary": "안심OK 방문약속 또는 일정 변경 문의",
    "keywords": [
      "안심OK 일정",
      "안심OK 점검",
      "케어 방문",
      "정기 점검",
      "안심OK 방문",
      "케어 일정",
      "안심 OK 점검",
      "필터 기사 일정",
      "케어 방문일",
      "정기관리 날짜",
      "관리 방문 일정",
      "안심OK 기사님"
    ],
    "intentRules": [
      [
        [
          "안심OK",
          "정기 관리",
          "정기관리",
          "정기 점검",
          "케어",
          "정기 방문"
        ],
        [
          "점검",
          "일정",
          "언제",
          "방문일",
          "방문 날짜",
          "담당자 방문",
          "오는지",
          "와요"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "업무 진입",
        "customer": "이번 달 안심OK 점검이 언제인가요?",
        "message": "제품을 사용하시는 주소와 계약을 확인한 뒤 안심OK 방문 일정을 찾아드릴게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "status",
        "condition": "당월 방문 배정과 일정 조회 성공",
        "message": "이번 달 안심OK 방문 일정이 확인됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "방문 예정일",
            "detail": "[예정일]"
          },
          {
            "title": "제품",
            "detail": "[제품군]"
          }
        ]
      },
      {
        "id": "s3",
        "stepId": "status",
        "condition": "당월 방문 배정 없음",
        "message": "이번 달에 배정된 안심OK 방문 내역은 확인되지 않아요. 점검이나 담당자 연락을 원하시면 요청 방법을 안내해 드릴게요.",
        "kind": "exception",
        "options": [
          "담당자 연락 요청"
        ]
      },
      {
        "id": "s4",
        "stepId": "hold",
        "condition": "연체로 조치 제한된 상태",
        "message": "미납 요금을 납부하신 뒤 안심OK 방문 관련 요청을 진행할 수 있어요. 납부 안내를 받아보시겠어요?",
        "kind": "choice",
        "options": [
          "요금 납부 안내",
          "나중에 확인"
        ]
      },
      {
        "id": "s5",
        "stepId": "branch",
        "condition": "방문월 변경·점검 요청. 관할 지국 이관",
        "message": "방문 일정을 조율할 수 있도록 관할 지국에 연락을 요청할게요.",
        "kind": "handoff",
        "options": [
          "담당자 연락 요청"
        ]
      },
      {
        "id": "s6",
        "stepId": "update",
        "condition": "일정 안내 후 연락처 변경 의사 확인",
        "message": "일정 안내를 받으실 새 연락처를 알려주세요.",
        "kind": "input",
        "placeholder": "안내받을 새 연락처"
      },
      {
        "id": "s7",
        "stepId": "deny",
        "condition": "계약자·사용자 또는 계약 정보 확인 실패",
        "message": "안심OK 이용 정보를 확인하지 못했어요. 제품을 사용하시는 주소와 연락처를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "E7",
        "stepId": "pay",
        "condition": "연체 확인 후 즉시 납부 요청",
        "message": "요금을 납부하는 방법을 안내해드릴게요.",
        "kind": "handoff",
        "options": [
          "요금 납부 안내"
        ]
      },
      {
        "id": "E8",
        "stepId": "agent",
        "condition": "일정 조회 이후 담당자 확인 필요",
        "message": "추가 확인이 필요한 요청이에요. 담당자와 상담할 수 있도록 연결해드릴게요.",
        "kind": "handoff",
        "options": [
          "상담사 연결"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "who"
      },
      {
        "from": "who",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "overdue",
        "label": "가능"
      },
      {
        "from": "valid",
        "to": "deny",
        "label": "불가"
      },
      {
        "from": "overdue",
        "to": "hold",
        "label": "제한"
      },
      {
        "from": "overdue",
        "to": "lookup",
        "label": "정상"
      },
      {
        "from": "hold",
        "to": "pay",
        "label": "즉시 납부 요청"
      },
      {
        "from": "hold",
        "to": "voc",
        "label": "안내만"
      },
      {
        "from": "pay",
        "to": "lookup",
        "label": "납부 확인"
      },
      {
        "from": "pay",
        "to": "voc",
        "label": "미납 유지"
      },
      {
        "from": "lookup",
        "to": "ask"
      },
      {
        "from": "ask",
        "to": "status",
        "label": "단순 조회"
      },
      {
        "from": "ask",
        "to": "update",
        "label": "연락처·주소 변경"
      },
      {
        "from": "ask",
        "to": "branch",
        "label": "방문월·지국 연락"
      },
      {
        "from": "ask",
        "to": "agent",
        "label": "상담이관 대상"
      },
      {
        "from": "status",
        "to": "voc"
      },
      {
        "from": "update",
        "to": "branch",
        "label": "지국 연락 필요"
      },
      {
        "from": "update",
        "to": "voc",
        "label": "수정만"
      },
      {
        "from": "deny",
        "to": "voc"
      },
      {
        "from": "branch",
        "to": "end"
      },
      {
        "from": "agent",
        "to": "end"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "예정일": "2026년 12월 2일(수)",
      "제품군": "직수 정수기"
    }
  },
  {
    "no": 31,
    "title": "주문/가입상담_구독(렌탈)가입신청문의",
    "displayTitle": "구독 가입 상담",
    "phase": "별도 검토",
    "category": "가입·심사",
    "summary": "구독 신규가입·교체·기기변경 상담",
    "keywords": [
      "신규 가입",
      "렌탈 가입",
      "가입신청",
      "렌탈 신청",
      "정수기 구독",
      "기기변경",
      "법인 견적",
      "정수기 렌탈하고",
      "정수기 신청",
      "구독 신규",
      "렌탈 제품 추천",
      "렌탈 가입 상담",
      "렌탈 견적",
      "구독 교체",
      "새 정수기 렌탈",
      "법인 구독 견적"
    ],
    "intentRules": [
      [
        [
          "정수기",
          "구독",
          "렌탈",
          "사업장",
          "법인",
          "제품"
        ],
        [
          "새로",
          "가입",
          "견적",
          "가입 신청",
          "가입상담",
          "렌탈하고",
          "구독하고",
          "빌리고",
          "빌려"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "ask",
        "condition": "별도 검토. 상담 접수 범위 초안",
        "customer": "정수기 구독하려는데 어떤 게 있나요?",
        "message": "어떤 구독 상담을 원하시나요?",
        "kind": "choice",
        "options": [
          "신규 가입",
          "기존 제품 교체",
          "법인 견적"
        ]
      },
      {
        "id": "s2",
        "stepId": "product",
        "condition": "별도 검토. 신규 상담에 필요한 정보 수집",
        "message": "상담받고 싶은 제품이나 모델을 알려주세요. 모델을 모르시면 제품 종류와 원하시는 기능만 알려주셔도 돼요.",
        "kind": "input",
        "placeholder": "예: 얼음이 나오는 정수기"
      },
      {
        "id": "s3",
        "stepId": "current",
        "condition": "별도 검토. 기존 계약 교체 상담",
        "message": "교체를 원하시는 제품을 알려주세요. 담당자가 계약기간과 교체 조건을 확인할 수 있어요.",
        "kind": "input",
        "placeholder": "교체하고 싶은 제품"
      },
      {
        "id": "s4",
        "stepId": "existing",
        "condition": "별도 검토. 판매처 선접수 여부는 시스템 조건. 고객의 다음 요청만 선택",
        "message": "기존 신청에 대해 추가 상담을 원하시면 접수한 판매처에서 이어서 확인해 드려요.",
        "kind": "choice",
        "options": [
          "판매처에 상담 요청",
          "여기서 마치기"
        ]
      },
      {
        "id": "s5",
        "stepId": "sales",
        "condition": "별도 검토. 상담 접수 후 판매처·상담사 연결 경로 제안",
        "message": "요청하신 제품과 상담 내용을 담당자에게 전달할 수 있어요. 상담 연결을 요청하시겠어요?",
        "kind": "handoff",
        "options": [
          "상담 요청하기"
        ]
      },
      {
        "id": "s6",
        "stepId": "b2b",
        "condition": "별도 검토. 법인 견적은 유관 부서 담당",
        "message": "법인 구독 견적은 담당 부서에서 확인해 드려요. 견적 상담을 신청하시겠어요?",
        "kind": "handoff",
        "options": [
          "법인 견적 상담"
        ]
      },
      {
        "id": "E6",
        "stepId": "reject",
        "condition": "별도 검토 · 가입 조건 확인 결과 추가 상담 필요",
        "message": "현재 확인된 정보로는 가입을 이어가기 어려워요. 가입 조건은 담당자에게 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "가입 상담"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "ask"
      },
      {
        "from": "ask",
        "to": "current",
        "label": "교체·기기변경"
      },
      {
        "from": "ask",
        "to": "product",
        "label": "신규"
      },
      {
        "from": "ask",
        "to": "b2b",
        "label": "법인 견적"
      },
      {
        "from": "current",
        "to": "apply"
      },
      {
        "from": "product",
        "to": "apply"
      },
      {
        "from": "b2b",
        "to": "voc"
      },
      {
        "from": "apply",
        "to": "existing",
        "label": "가입 진행"
      },
      {
        "from": "apply",
        "to": "sales",
        "label": "재통화·추가 상담"
      },
      {
        "from": "apply",
        "to": "voc",
        "label": "안내만"
      },
      {
        "from": "existing",
        "to": "sales",
        "label": "선접수 있음"
      },
      {
        "from": "existing",
        "to": "pre",
        "label": "선접수 없음·AS-IS 경로"
      },
      {
        "from": "pre",
        "to": "auth"
      },
      {
        "from": "auth",
        "to": "order",
        "label": "통과"
      },
      {
        "from": "auth",
        "to": "reject",
        "label": "미통과"
      },
      {
        "from": "reject",
        "to": "voc"
      },
      {
        "from": "order",
        "to": "voc"
      },
      {
        "from": "sales",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ]
  },
  {
    "no": 32,
    "title": "만기상담_멤버십 가입신청/비용문의",
    "displayTitle": "만기 후 멤버십 가입·비용",
    "phase": "별도 검토",
    "category": "가입·심사",
    "summary": "멤버십 가입·케어 유지·비용 문의",
    "keywords": [
      "만기 상담",
      "멤버십 가입",
      "구독 끝나고 관리",
      "만기 후 관리",
      "멤버십 가입비",
      "멤버십 비용",
      "구독 만기 후",
      "계약 끝난 후 케어",
      "계약 종료 후 관리",
      "멤버십 전환",
      "만기 멤버십",
      "멤버십 비용 확인"
    ],
    "intentRules": [
      [
        [
          "구독",
          "렌탈",
          "계약",
          "멤버십"
        ],
        [
          "만기",
          "종료",
          "끝났",
          "끝나",
          "만료"
        ],
        [
          "케어",
          "관리",
          "점검",
          "가입",
          "전환",
          "유지",
          "계속"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "별도 검토. 업무 진입",
        "customer": "구독이 끝난 뒤에도 관리받고 싶어요.",
        "message": "이용하시는 제품의 멤버십 가입 가능 여부와 비용을 확인해 드릴게요.",
        "kind": "intro"
      },
      {
        "id": "s2",
        "stepId": "lookup",
        "condition": "별도 검토. 보유 제품과 제조연월 확인",
        "message": "제품에 표시된 제조번호를 알려주세요. 제조연월과 제품 정보로 가입 가능 여부를 확인할 수 있어요.",
        "kind": "input",
        "placeholder": "제품 제조번호 입력"
      },
      {
        "id": "s3",
        "stepId": "mc",
        "condition": "별도 검토. 기존 구독 상태상 방문관리 MC 안내 대상",
        "message": "구독 만기 이후 이용하실 수 있는 관리 서비스는 방문 담당자가 안내해 드려요. 상담을 요청하시겠어요?",
        "kind": "handoff",
        "options": [
          "방문 담당자 상담"
        ]
      },
      {
        "id": "s4",
        "stepId": "ineligible",
        "condition": "별도 검토. 제조 후 6년 초과 확인",
        "message": "이 제품은 제조 후 6년이 지나 멤버십에 가입하기 어려워요. 유상 필터 교체나 신규 구독을 안내해 드릴 수 있어요.",
        "kind": "exception",
        "options": [
          "유상 필터 교체",
          "신규 구독 안내"
        ]
      },
      {
        "id": "s5",
        "stepId": "cost",
        "condition": "별도 검토. 가입 가능 대상, 조회 금액 확인",
        "message": "확인된 멤버십 비용을 안내해 드려요.",
        "kind": "result",
        "items": [
          {
            "title": "월 멤버십료",
            "detail": "[월 금액]"
          },
          {
            "title": "전체 필터 교체비",
            "detail": "[일회 비용]"
          }
        ]
      },
      {
        "id": "s6",
        "stepId": "apply",
        "condition": "별도 검토. 가입 의사 수집, 주문·결제·전자서명 자동화 미확정",
        "message": "가입을 원하시면 담당자에게 다음 절차를 안내받으실 수 있어요.",
        "kind": "choice",
        "options": [
          "가입 상담 요청",
          "비용 안내만 받기"
        ]
      },
      {
        "id": "E6",
        "stepId": "fail",
        "condition": "별도 검토 · 본인확인 실패 또는 정보 제공 미동의",
        "message": "필요한 확인을 완료하지 못해 가입 신청이 중단됐어요. 도움이 필요하시면 가입 상담을 요청해 주세요.",
        "kind": "exception",
        "options": [
          "가입 상담"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "lookup"
      },
      {
        "from": "lookup",
        "to": "state"
      },
      {
        "from": "state",
        "to": "mc",
        "label": "만기 안내·MC 대상"
      },
      {
        "from": "state",
        "to": "age",
        "label": "전환 검토 대상"
      },
      {
        "from": "state",
        "to": "ineligible",
        "label": "가입 제한 계약"
      },
      {
        "from": "mc",
        "to": "voc"
      },
      {
        "from": "age",
        "to": "ineligible",
        "label": "6년 경과"
      },
      {
        "from": "age",
        "to": "cost",
        "label": "대상"
      },
      {
        "from": "ineligible",
        "to": "voc"
      },
      {
        "from": "cost",
        "to": "apply"
      },
      {
        "from": "apply",
        "to": "pre",
        "label": "신청"
      },
      {
        "from": "apply",
        "to": "voc",
        "label": "비용 안내만"
      },
      {
        "from": "pre",
        "to": "auth"
      },
      {
        "from": "auth",
        "to": "order",
        "label": "충족"
      },
      {
        "from": "auth",
        "to": "fail",
        "label": "실패·미동의"
      },
      {
        "from": "fail",
        "to": "voc"
      },
      {
        "from": "order",
        "to": "pay"
      },
      {
        "from": "pay",
        "to": "sign"
      },
      {
        "from": "sign",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "월 금액": "19,900원",
      "일회 비용": "무료"
    }
  },
  {
    "no": 33,
    "title": "주문/가입상담_구독(렌탈)컨택재요청",
    "displayTitle": "구독 신청 후 연락 재요청",
    "phase": "별도 검토",
    "category": "가입·심사",
    "summary": "부재중 전화·주문 상담 재연락 요청",
    "keywords": [
      "구독 심사 전화",
      "상담 재연락",
      "가입 연락 재요청",
      "심사 전화 못 받음",
      "모바일 구독확인서",
      "심사 전화 다시",
      "구독 담당자 전화",
      "렌탈 담당자 연락",
      "구독 상담 전화 다시",
      "가입 상담 재연락",
      "심사 전화 놓쳤"
    ],
    "intentRules": [
      [
        [
          "구독",
          "렌탈",
          "가입",
          "심사"
        ],
        [
          "전화",
          "연락",
          "담당자",
          "상담사"
        ],
        [
          "다시",
          "못 받",
          "놓쳤",
          "부재",
          "재연락",
          "연결 부탁"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "source",
        "condition": "별도 검토. 업무 진입",
        "customer": "구독 심사 전화가 왔는데 못 받았어요.",
        "message": "어떤 연락에 대해 다시 통화하고 싶으신가요?",
        "kind": "choice",
        "options": [
          "구독 신청·심사",
          "기존 담당자와 통화",
          "모바일 구독확인서"
        ]
      },
      {
        "id": "s2",
        "stepId": "mobile",
        "condition": "별도 검토. 모바일 구독확인서 방식 안내",
        "message": "모바일 구독확인서에서 진행 방식을 전화상담으로 변경하실 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "이용 방법",
            "detail": "모바일 구독확인서에서 전화상담 선택"
          }
        ]
      },
      {
        "id": "s3",
        "stepId": "who",
        "condition": "별도 검토. 진계약컨택 조회 전 고객 식별",
        "message": "부재중 연락을 받으신 휴대폰 번호나 구독 신청에 등록한 번호와 계약자 성함을 알려주세요.",
        "kind": "input",
        "placeholder": "수신한 번호와 계약자 성함"
      },
      {
        "id": "s4",
        "stepId": "lookup",
        "condition": "별도 검토. 최종 담당자·예정자 조회 불가",
        "message": "말씀하신 정보로는 이전 연락의 담당자를 확인하기 어려워요. 구독을 신청할 때 등록한 전화번호로 한 번 더 확인해 주세요.",
        "kind": "exception",
        "options": [
          "다시 확인하기"
        ]
      },
      {
        "id": "s5",
        "stepId": "request",
        "condition": "별도 검토. 최종 컨택 담당자 확인 후 요청 의사 수집",
        "message": "확인된 담당자에게 다시 연락해 달라고 전달할까요?",
        "kind": "handoff",
        "options": [
          "재연락 요청",
          "여기서 마치기"
        ]
      },
      {
        "id": "s6",
        "stepId": "request",
        "condition": "별도 검토. 메신저 전달 성공 응답이 있는 경우",
        "message": "담당자에게 재연락 요청을 전달했어요. 연락받을 번호는 [마스킹된 번호]예요.",
        "kind": "result"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "source"
      },
      {
        "from": "source",
        "to": "mobile",
        "label": "모바일 구독확인서"
      },
      {
        "from": "source",
        "to": "who",
        "label": "일반 재연락·주문 심사 부재"
      },
      {
        "from": "mobile",
        "to": "who",
        "label": "전화 재연락 요청"
      },
      {
        "from": "mobile",
        "to": "voc",
        "label": "방법 안내만"
      },
      {
        "from": "who",
        "to": "lookup"
      },
      {
        "from": "lookup",
        "to": "request",
        "label": "담당 확인"
      },
      {
        "from": "lookup",
        "to": "voc",
        "label": "담당 확인 불가"
      },
      {
        "from": "request",
        "to": "voc"
      },
      {
        "from": "voc",
        "to": "end"
      }
    ],
    "demoValues": {
      "마스킹된 번호": "010-••••-1234"
    }
  },
  {
    "no": 34,
    "title": "AS서비스 상담/접수_방문전 사전 연락요청",
    "displayTitle": "방문 전 사전 연락 요청",
    "phase": "2차",
    "category": "AS·케어",
    "summary": "방문 전 사전 연락 문의",
    "keywords": [
      "사전 연락",
      "방문 전 전화",
      "기사님 사전 연락",
      "기사 오기 전에 연락",
      "기사님 오기 전에 전화",
      "기사님이 오기 전에",
      "기사 방문 전에 전화",
      "기사님 방문 전",
      "기사님 먼저 연락",
      "오시기 전에 전화",
      "오시기 전에 연락"
    ],
    "intentRules": [
      [
        [
          "기사",
          "방문",
          "도착",
          "오시기"
        ],
        [
          "전",
          "오시기 전",
          "오기 전",
          "미리",
          "사전"
        ],
        [
          "연락",
          "전화",
          "메시지",
          "문자"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "방문 전 사전 연락 요청",
        "message": "예정된 서비스 방문을 확인해 드릴게요.",
        "kind": "intro",
        "customer": "기사님이 방문 전에 전화 주실 수 있나요?"
      },
      {
        "id": "s2",
        "stepId": "c",
        "condition": "고객 특정 필요",
        "message": "서비스를 받으실 분의 연락처와 성함, 주소를 알려 주세요.",
        "kind": "input",
        "items": [
          {
            "title": "확인할 정보",
            "detail": "연락처, 성함, 주소"
          }
        ],
        "placeholder": "연락처, 성함, 시·구"
      },
      {
        "id": "s3",
        "stepId": "m",
        "condition": "같은 연락처로 여러 고객 조회",
        "message": "같은 연락처로 조회된 정보가 여러 건이에요. 서비스를 받으실 분의 성함과 주소를 다시 확인해 주세요.",
        "kind": "input",
        "placeholder": "성함과 주소"
      },
      {
        "id": "s4",
        "stepId": "a",
        "condition": "미처리 접수 및 일정 확인",
        "message": "방문 예정일은 11월 27일(금)이에요. 담당 매니저가 방문 당일 오전 10시 전에 연락드려 시간을 조율해요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 제품",
            "detail": "정수기"
          },
          {
            "title": "방문 예정일",
            "detail": "11월 27일(금)"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "d",
        "condition": "일정 안내 후 추가 요청 확인",
        "message": "방문 전에 별도로 연락받기를 원하시나요?",
        "kind": "choice",
        "options": [
          "사전 연락 요청",
          "일정 안내로 충분해요"
        ]
      },
      {
        "id": "s6",
        "stepId": "h",
        "condition": "사업장이관 VOC 등록 성공",
        "message": "방문 전 연락 요청을 담당 사업장에 전달했어요. 연락 시간은 담당 매니저가 확인해요.",
        "kind": "handoff"
      },
      {
        "id": "s7",
        "stepId": "e",
        "condition": "일정 안내만 요청",
        "message": "방문 예정일을 안내해 드렸어요. 담당 매니저가 방문 당일 오전 10시 전에 연락드려요.",
        "kind": "result"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "c"
      },
      {
        "from": "c",
        "to": "m"
      },
      {
        "from": "m",
        "to": "q",
        "label": "대상 고객 확인"
      },
      {
        "from": "m",
        "to": "c",
        "label": "여러 후보: 사용자 연락처·이름·주소 재확인"
      },
      {
        "from": "q",
        "to": "a"
      },
      {
        "from": "a",
        "to": "d"
      },
      {
        "from": "d",
        "to": "h",
        "label": "요청"
      },
      {
        "from": "d",
        "to": "v",
        "label": "일정 안내로 충분"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 35,
    "title": "서비스비용문의",
    "displayTitle": "서비스 비용 문의",
    "phase": "2차",
    "category": "AS·케어",
    "summary": "서비스 비용 문의",
    "keywords": [
      "서비스비용",
      "이전설치 비용",
      "필터 교체 비용",
      "AS 점검 비용",
      "수리비",
      "출장비",
      "설치비",
      "출장료",
      "이전설치 얼마",
      "이전 설치 비용",
      "재설치 얼마",
      "재설치 비용",
      "수리 얼마",
      "수리 비용",
      "AS 비용",
      "설치 얼마",
      "필터 교체 얼마"
    ],
    "intentRules": [
      [
        [
          "이전설치",
          "재설치",
          "설치",
          "출장",
          "방문",
          "수리",
          "AS",
          "필터 교체",
          "점검"
        ],
        [
          "비용",
          "출장비",
          "출장료",
          "설치비",
          "수리비",
          "얼마",
          "돈",
          "금액"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "d",
        "condition": "문의 유형 확인",
        "message": "어떤 서비스 비용이 궁금하신가요?",
        "kind": "choice",
        "options": [
          "이전설치",
          "필터 교체",
          "AS 점검"
        ],
        "customer": "정수기 이전할 때 비용이 얼마나 드나요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "대상 제품·판매유형 확인",
        "message": "제품명이나 모델명을 알려 주세요. 구독, 멤버십, 일시불 중 해당하는 유형이 있으면 함께 알려 주세요.",
        "kind": "input",
        "placeholder": "제품명 또는 모델명"
      },
      {
        "id": "s3",
        "stepId": "a",
        "condition": "이전설치 비용 기준 확인",
        "message": "직수 정수기의 기본 비용을 확인했어요. 설치 환경에 따라 추가 비용이 발생할 수 있어요. 제품 운반 서비스는 제공하지 않아요.",
        "kind": "result",
        "items": [
          {
            "title": "분리 기본비",
            "detail": "20,000원"
          },
          {
            "title": "재설치 기본비",
            "detail": "35,000원"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "f",
        "condition": "모델별 필터 기준 미확정",
        "message": "직수 정수기의 필터 교체 금액은 현재 확인이 필요해요. 모델명을 기준으로 비용을 확인해 주세요.",
        "kind": "exception",
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "r",
        "condition": "AS 비용 기준 확인",
        "message": "직수 정수기의 비용은 보증·계약 상태와 고장 원인에 따라 달라요. 부품이 필요한 경우 방문 점검 후 정확한 비용을 안내받을 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "비용 기준",
            "detail": "보증 조건과 고장 원인에 따라 달라요."
          },
          {
            "title": "비용 확정",
            "detail": "방문 점검 필요"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "q",
        "condition": "비용 안내 후 접수 의사 확인",
        "message": "비용 안내에 이어 서비스 접수도 도와드릴까요?",
        "kind": "choice",
        "options": [
          "서비스 접수",
          "비용만 확인"
        ]
      },
      {
        "id": "s7",
        "stepId": "h",
        "condition": "분리·재설치·AS 접수 흐름 연결",
        "message": "재설치 접수로 이어갈게요. 다음 단계에서 접수 정보를 확인해 주세요.",
        "kind": "handoff",
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "d"
      },
      {
        "from": "d",
        "to": "p",
        "label": "이전설치"
      },
      {
        "from": "d",
        "to": "f",
        "label": "필터 교체"
      },
      {
        "from": "d",
        "to": "r",
        "label": "AS 비용"
      },
      {
        "from": "p",
        "to": "a"
      },
      {
        "from": "a",
        "to": "q"
      },
      {
        "from": "r",
        "to": "q"
      },
      {
        "from": "f",
        "to": "q"
      },
      {
        "from": "q",
        "to": "h",
        "label": "접수 요청"
      },
      {
        "from": "q",
        "to": "v",
        "label": "비용 확인"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 36,
    "title": "설치 단순문의_설치/회수_접수/일정/방문 확인요청",
    "displayTitle": "설치·회수 일정 확인",
    "phase": "2차",
    "category": "배송·설치",
    "summary": "설치·회수 일정 문의",
    "keywords": [
      "제품 회수",
      "회수 일정",
      "수거 일정",
      "언제 가져가나요",
      "정수기 회수",
      "설치 회수 일정",
      "철거 기사 언제",
      "회수 언제",
      "수거 언제",
      "제품 가져가는 날",
      "회수 접수 내역",
      "정수기 언제 수거",
      "회수 방문 시간"
    ],
    "intentRules": [
      [
        [
          "수거",
          "회수",
          "가져가",
          "철거"
        ],
        [
          "언제",
          "일정",
          "방문",
          "날짜",
          "오는지",
          "오나요",
          "몇 시"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "회수·설치 일정 문의",
        "message": "어떤 방문 일정을 확인할까요?",
        "kind": "intro",
        "options": [
          "제품 회수",
          "제품 설치"
        ],
        "customer": "해지한 정수기를 언제 가져가나요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "회수 계약 확인",
        "message": "회수하실 제품과 계약자 정보를 확인할게요.",
        "kind": "input",
        "items": [
          {
            "title": "개인 계약",
            "detail": "계약자 성함, 연락처, 생년월일, 주소"
          },
          {
            "title": "법인 계약",
            "detail": "법인명, 사업자번호, 담당자 정보, 주소"
          }
        ],
        "placeholder": "대상 제품 또는 계약 선택"
      },
      {
        "id": "s3",
        "stepId": "w",
        "condition": "정산금 입금대기 조회",
        "message": "직수 정수기 계약의 해약 상태는 ‘입금대기’예요. 정산금 납부가 반영되면 해약 접수 상태를 다시 확인할 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "해약 상태",
            "detail": "입금대기"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "a",
        "condition": "해약 접수·회수 일정 조회",
        "message": "회수 요청일은 11월 30일(월)이에요. 설치 담당자가 당일 오전 10시 전에 연락드려 방문 시간을 조율해요.",
        "kind": "result",
        "items": [
          {
            "title": "대상 제품",
            "detail": "직수 정수기"
          },
          {
            "title": "회수 요청일",
            "detail": "11월 30일(월)"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "r",
        "condition": "회수일 안내 후 요청 확인",
        "message": "추가로 도와드릴 일이 있나요?",
        "kind": "choice",
        "options": [
          "회수일 변경",
          "방문 담당자에게 전달",
          "일정만 확인"
        ]
      },
      {
        "id": "s6",
        "stepId": "c",
        "condition": "회수일 변경 가능 일정 조회",
        "message": "회수 가능한 날짜를 확인했어요. 표시된 날짜 중 원하시는 날짜를 선택해 주세요.",
        "kind": "input",
        "items": [
          {
            "title": "선택 가능일",
            "detail": "11월 30일(월), 12월 2일(수)"
          }
        ],
        "placeholder": "가능 날짜 선택",
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "u",
        "condition": "해약 요청일 변경 저장 완료",
        "message": "회수 요청일을 12월 2일(수)로 변경했어요.",
        "kind": "result",
        "items": [
          {
            "title": "변경한 회수 요청일",
            "detail": "12월 2일(수)"
          }
        ],
        "demo": true
      },
      {
        "id": "s8",
        "stepId": "t",
        "condition": "당일 건 또는 별도 전달 요청 이관",
        "message": "요청하신 내용을 설치 담당자에게 전달하도록 남겼어요. 방문 일정 변경은 담당자가 확인해요.",
        "kind": "handoff",
        "items": [
          {
            "title": "전달 내용",
            "detail": "방문 전에 전화로 시간 확인 요청"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "q"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "w",
        "label": "입금대기·상태 문의"
      },
      {
        "from": "d",
        "to": "a",
        "label": "해약접수·회수일 문의"
      },
      {
        "from": "a",
        "to": "r"
      },
      {
        "from": "w",
        "to": "v"
      },
      {
        "from": "r",
        "to": "c",
        "label": "회수일 변경"
      },
      {
        "from": "r",
        "to": "t",
        "label": "기사 전달·당일 건"
      },
      {
        "from": "r",
        "to": "v",
        "label": "일정 확인만"
      },
      {
        "from": "c",
        "to": "u",
        "label": "가능한 일자 확정"
      },
      {
        "from": "c",
        "to": "t",
        "label": "요청일 조율 불가·전달 요청"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "t",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 37,
    "title": "당사관련 서류 요청",
    "displayTitle": "SK매직 관련 서류 요청",
    "phase": "3차",
    "category": "문서발송",
    "summary": "당사 증명서 요청",
    "keywords": [
      "완납증명서",
      "4대보험 완납증명서",
      "국세 완납증명서",
      "지방세 완납증명서",
      "사업자등록증",
      "회사 서류",
      "보험료 납부확인서",
      "건강보험 완납",
      "건강보험료 완납",
      "건강 연금 완납",
      "국세 납부 증명",
      "납세증명서",
      "당사 서류",
      "사업자 등록증 보내",
      "법인 서류"
    ],
    "intentRules": [
      [
        [
          "사업자등록증",
          "사업자등록",
          "완납증명서",
          "납세증명서",
          "법인 서류",
          "보험료 완납",
          "납부확인서"
        ],
        [
          "필요",
          "받고",
          "받을",
          "발송",
          "발급",
          "보내",
          "요청",
          "부탁"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "i",
        "condition": "요청할 증명서 종류 확인",
        "message": "어떤 서류를 보내드릴까요?",
        "kind": "choice",
        "options": [
          "4대보험 완납증명서",
          "건강·연금 완납증명서",
          "국세 완납증명서",
          "지방세 완납증명서",
          "사업자등록증"
        ],
        "customer": "건강보험료 완납증명서를 받고 싶어요."
      },
      {
        "id": "s2",
        "stepId": "p",
        "condition": "당월분 발송 가능일 전",
        "message": "12월 4대보험 완납증명서은 12월 15일 이후에 보내드릴 수 있어요. 전월 서류를 받으시겠어요?",
        "kind": "choice",
        "options": [
          "전월분 받기",
          "다음에 요청하기"
        ],
        "demo": true
      },
      {
        "id": "s3",
        "stepId": "c",
        "condition": "요청 권한·계약 정보 확인",
        "message": "서류를 받기 위해 계약 정보를 확인할게요. 개인·개인사업자 계약은 계약자 본인, 법인 계약은 소속 직원이 요청할 수 있어요.",
        "kind": "input",
        "items": [
          {
            "title": "확인할 정보",
            "detail": "계약자 또는 법인 정보"
          }
        ],
        "placeholder": "계약 확인 정보"
      },
      {
        "id": "s4",
        "stepId": "x",
        "condition": "계약정보 불일치 또는 요청 권한 확인 불가",
        "message": "요청하신 계약 정보를 확인할 수 없어 서류를 보내드리기 어려워요. 입력한 정보를 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s5",
        "stepId": "f",
        "condition": "요청 권한과 문서 확인 완료",
        "message": "서류를 한 번만 받으시겠어요, 매월 정해진 날에 받으시겠어요?",
        "kind": "choice",
        "options": [
          "한 번 받기",
          "매월 받기"
        ]
      },
      {
        "id": "s6",
        "stepId": "t",
        "condition": "정기 발송 선택",
        "message": "매월 12~28일 중 하루 또는 매월 말일을 선택해 주세요.",
        "kind": "input",
        "items": [
          {
            "title": "가능한 발송일",
            "detail": "12~28일 또는 매월 말일"
          }
        ],
        "placeholder": "정기 발송일 선택"
      },
      {
        "id": "s7",
        "stepId": "m",
        "condition": "발송 채널과 수신처 확인",
        "message": "이메일, 팩스, 또는 두 가지 모두로 받을 수 있어요. 선택하신 방식의 수신 정보를 알려 주세요.",
        "kind": "input",
        "options": [
          "이메일",
          "팩스",
          "이메일과 팩스"
        ],
        "placeholder": "이메일 주소 또는 팩스 번호"
      },
      {
        "id": "s8",
        "stepId": "u",
        "condition": "일회성 발송 또는 정기 신청 처리",
        "message": "4대보험 완납증명서 발송 요청을 처리했어요.",
        "kind": "result",
        "items": [
          {
            "title": "발송 방식",
            "detail": "sample@example.com"
          },
          {
            "title": "발송 구분",
            "detail": "일회성 발송"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "d"
      },
      {
        "from": "d",
        "to": "c",
        "label": "발송 가능·사업자등록증"
      },
      {
        "from": "d",
        "to": "p",
        "label": "발송 가능일 전"
      },
      {
        "from": "p",
        "to": "c",
        "label": "전월분 수신"
      },
      {
        "from": "p",
        "to": "v",
        "label": "수신 보류"
      },
      {
        "from": "c",
        "to": "a"
      },
      {
        "from": "a",
        "to": "x",
        "label": "불일치·권한 없음"
      },
      {
        "from": "a",
        "to": "f",
        "label": "일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "f",
        "to": "m",
        "label": "일회성"
      },
      {
        "from": "f",
        "to": "t",
        "label": "정기"
      },
      {
        "from": "t",
        "to": "m"
      },
      {
        "from": "m",
        "to": "u"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 38,
    "title": "배송/설치_주문취소",
    "displayTitle": "설치 전 주문 취소",
    "phase": "3차",
    "category": "배송·설치",
    "summary": "배송·설치 주문취소 요청",
    "keywords": [
      "주문 취소",
      "설치 전 취소",
      "설치 전에 취소",
      "배송 취소",
      "렌탈 주문 취소",
      "렌탈 주문 철회",
      "구매 주문 취소",
      "배송 예약 취소",
      "제품 주문 취소",
      "설치받기 전 취소",
      "아직 설치 전인데 취소",
      "주문을 취소"
    ],
    "intentRules": [
      [
        [
          "주문",
          "설치 받기 전",
          "설치 전",
          "배송 예약"
        ],
        [
          "취소",
          "철회",
          "없애",
          "하지 않",
          "신청 안"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "배송·설치 주문취소 시작",
        "message": "취소하실 주문을 먼저 확인할게요.",
        "kind": "intro",
        "customer": "아직 설치 전인데 주문을 취소하고 싶어요."
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "취소할 주문 특정",
        "message": "설치받으실 분의 성함, 연락처, 주소를 확인해 주세요. 조회된 주문 중 취소할 제품과 취소 사유를 알려 주세요.",
        "kind": "input",
        "placeholder": "설치받으실 분 정보 또는 취소 사유"
      },
      {
        "id": "s3",
        "stepId": "o",
        "condition": "일치하는 주문 확인",
        "message": "이 주문을 취소하시겠어요?",
        "kind": "choice",
        "options": [
          "이 주문 취소",
          "다시 확인"
        ],
        "items": [
          {
            "title": "대상 제품",
            "detail": "직수 정수기"
          },
          {
            "title": "설치 주문",
            "detail": "DL-261125-001"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "u",
        "condition": "취소 가능한 구독 주문 처리 완료",
        "message": "직수 정수기의 구독 주문이 취소됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "취소 대상",
            "detail": "직수 정수기 구독 주문"
          },
          {
            "title": "처리 상태",
            "detail": "취소 완료"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "l",
        "condition": "취소 가능한 일시불 주문 처리 완료",
        "message": "직수 정수기의 일시불 주문이 취소됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "취소 대상",
            "detail": "직수 정수기 일시불 주문"
          },
          {
            "title": "처리 상태",
            "detail": "취소 완료"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "h",
        "condition": "납품생성 또는 출고 상태로 전달 필요",
        "message": "배송 준비가 진행 중이어서 설치 담당자에게 취소 요청을 전달할게요. 담당자가 취소 가능 여부를 확인해요.",
        "kind": "handoff",
        "items": [
          {
            "title": "처리 상태",
            "detail": "취소 요청 전달 예정"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "o"
      },
      {
        "from": "o",
        "to": "d"
      },
      {
        "from": "d",
        "to": "h",
        "label": "납품생성·출고"
      },
      {
        "from": "d",
        "to": "k",
        "label": "취소 가능 상태"
      },
      {
        "from": "k",
        "to": "u",
        "label": "구독"
      },
      {
        "from": "k",
        "to": "l",
        "label": "일시불"
      },
      {
        "from": "h",
        "to": "m"
      },
      {
        "from": "m",
        "to": "v"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "l",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 39,
    "title": "수납 단순문의_구독료/멤버십료 입금확인",
    "displayTitle": "구독료·멤버십료 입금 확인",
    "phase": "2차",
    "category": "결제·납부",
    "summary": "구독료·멤버십료 입금 문의",
    "keywords": [
      "입금확인",
      "납부 결과",
      "결제 됐나요",
      "이중 결제",
      "구독료 빠져나갔나요",
      "가상계좌 입금",
      "입금 확인",
      "이번 달 돈 나갔",
      "요금 빠졌",
      "요금 냈는데",
      "납부됐는지",
      "납부 됐나요",
      "결제 여부",
      "결제완료 확인",
      "구독료 납부 확인",
      "두 번 결제",
      "중복 출금"
    ],
    "intentRules": [
      [
        [
          "납부",
          "입금",
          "요금",
          "결제",
          "가상계좌",
          "구독료"
        ],
        [
          "됐",
          "되었",
          "냈는데",
          "정상",
          "제대로",
          "나갔",
          "빠져나",
          "들어갔",
          "보냈",
          "결제 여부",
          "입금 여부",
          "납부 완료",
          "결제 완료",
          "입금 완료"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "입금 문의 종류 확인",
        "message": "어떤 납부 정보를 확인할까요?",
        "kind": "choice",
        "options": [
          "이번 달 납부 결과",
          "사용 기간",
          "이중 결제·가상계좌 입금"
        ],
        "customer": "이번 달 구독료가 제대로 빠져나갔나요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "조회 권한 및 계약 일치 확인",
        "message": "납부 정보를 확인하려면 계약을 먼저 확인해야 해요.",
        "kind": "input",
        "placeholder": "조회할 계약 선택"
      },
      {
        "id": "reuse006Pass",
        "stepId": "i",
        "condition": "006 공통 인증 재사용안 · 개인·개인사업자 · PASS 기완료 아님",
        "message": "구독료 납부 결과를 조회하려면 계약자 본인의 PASS 인증이 필요해요.",
        "kind": "choice",
        "options": [
          "PASS 본인인증"
        ]
      },
      {
        "id": "s3",
        "stepId": "x",
        "condition": "계약 조회·권한 확인 불가",
        "message": "계약 정보를 확인할 수 없어 납부 내역을 안내하기 어려워요. 계약자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s4",
        "stepId": "w",
        "condition": "일반 청구·납부 상태 확인",
        "message": "11월 구독료가 납부됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "정기 결제일",
            "detail": "매월 25일"
          },
          {
            "title": "청구 금액",
            "detail": "29,900원"
          },
          {
            "title": "납부 금액",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "m",
        "condition": "청구금액 0이며 면제 조건 확인",
        "message": "11월에는 구독료 면제 프로모션이 적용되어 청구 금액이 0원이에요.",
        "kind": "result",
        "items": [
          {
            "title": "확인된 면제 사유",
            "detail": "구독료 면제 프로모션"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "p",
        "condition": "미납 결제 또는 납부정보 변경 요청",
        "message": "요금 납부로 이어갈게요. 다음 단계에서 대상 계약과 납부 정보를 확인해 주세요.",
        "kind": "handoff",
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "c",
        "condition": "구독료 사용기간 확인",
        "message": "11월 구독료는 10월 25일부터 11월 24일까지의 사용료예요.",
        "kind": "result",
        "items": [
          {
            "title": "사용 기간",
            "detail": "10월 25일~11월 24일"
          }
        ],
        "demo": true
      },
      {
        "id": "s8",
        "stepId": "h",
        "condition": "이중 납부 환불 또는 추가 확인 필요",
        "message": "이중 납부 내역은 상담사가 확인해 드릴게요. 오늘 결제한 건은 다음 날부터 확인할 수 있어요.",
        "kind": "handoff"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "t",
        "label": "일치"
      },
      {
        "from": "t",
        "to": "q",
        "label": "당월 결제·입금"
      },
      {
        "from": "t",
        "to": "c",
        "label": "사용기간"
      },
      {
        "from": "t",
        "to": "b",
        "label": "이중 납부·가상계좌"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "w",
        "label": "결제일 전·납부 완료·종료"
      },
      {
        "from": "d",
        "to": "m",
        "label": "청구금액 0"
      },
      {
        "from": "d",
        "to": "p",
        "label": "미납 결제·정보변경 요청"
      },
      {
        "from": "m",
        "to": "w"
      },
      {
        "from": "b",
        "to": "h",
        "label": "환불 또는 추가 확인 필요"
      },
      {
        "from": "b",
        "to": "w",
        "label": "반영 상태 안내"
      },
      {
        "from": "p",
        "to": "e"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "w",
        "to": "v"
      },
      {
        "from": "c",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 40,
    "title": "해약취소(철회)문의",
    "displayTitle": "해약 취소·철회 문의",
    "phase": "3차",
    "category": "계약·해약",
    "summary": "해약취소·철회 요청",
    "keywords": [
      "해약취소",
      "해약 철회",
      "해지 취소",
      "해지 철회",
      "해약 신청 취소",
      "구독해지 취소",
      "해약을 취소",
      "해지를 취소",
      "해지 요청 철회",
      "해약을 철회",
      "해지 신청 철회",
      "구독 계속 쓰고",
      "취소한 구독 복구"
    ],
    "intentRules": [
      [
        [
          "해약",
          "해지"
        ],
        [
          "철회",
          "취소",
          "계속 쓰",
          "복구",
          "번복"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "해약철회 문의",
        "message": "해약을 취소할 수 있는 상태인지 먼저 확인할게요.",
        "kind": "intro",
        "customer": "신청한 해지를 취소할 수 있을까요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "조회 권한·계약 정보 확인",
        "message": "해약을 신청한 계약을 확인해 주세요.",
        "kind": "input",
        "placeholder": "해약 신청 계약 선택"
      },
      {
        "id": "s3",
        "stepId": "x",
        "condition": "조회 권한 또는 계약 정보 확인 불가",
        "message": "계약 정보를 확인할 수 없어 해약 신청 상태를 안내하기 어려워요. 계약자 정보를 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s4",
        "stepId": "n",
        "condition": "해약확정",
        "message": "이 계약은 해약이 확정되어 이전 계약 상태로 복원할 수 없어요.",
        "kind": "exception",
        "items": [
          {
            "title": "해약 상태",
            "detail": "해약확정"
          }
        ]
      },
      {
        "id": "s5",
        "stepId": "c",
        "condition": "철회 가능한 해약 상태",
        "message": "직수 정수기의 해약 신청을 철회할 수 있어요. 해약철회를 진행할까요?",
        "kind": "choice",
        "options": [
          "해약철회 진행",
          "해약 신청 유지"
        ],
        "items": [
          {
            "title": "대상 계약",
            "detail": "직수 정수기"
          },
          {
            "title": "해약 상태",
            "detail": "해약 접수"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "a",
        "condition": "카드 취소 처리 확인",
        "message": "해약금 카드 결제를 취소했어요. 카드사에 반영되기까지 영업일 기준 3~5일이 걸릴 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "취소 금액",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "r",
        "condition": "환불 대상 수납 확인 및 동의 필요",
        "message": "납부하신 해약금 29,900원을 계약자 명의의 계좌로만 환불할 수 있어요. 환불을 진행하시겠어요?",
        "kind": "choice",
        "options": [
          "환불 진행",
          "진행하지 않기"
        ],
        "items": [
          {
            "title": "환불 대상",
            "detail": "29,900원"
          }
        ],
        "demo": true
      },
      {
        "id": "s8",
        "stepId": "u",
        "condition": "해약취소 처리 완료",
        "message": "직수 정수기의 해약 신청이 취소됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "처리 상태",
            "detail": "해약철회 완료"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "q",
        "label": "일치"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "n",
        "label": "해약확정"
      },
      {
        "from": "n",
        "to": "v"
      },
      {
        "from": "d",
        "to": "c",
        "label": "철회 가능 상태"
      },
      {
        "from": "c",
        "to": "v",
        "label": "철회 보류"
      },
      {
        "from": "c",
        "to": "f",
        "label": "철회 동의"
      },
      {
        "from": "f",
        "to": "u",
        "label": "입금대기·취소 상태"
      },
      {
        "from": "f",
        "to": "p",
        "label": "해약접수·수납 반영"
      },
      {
        "from": "p",
        "to": "a",
        "label": "카드"
      },
      {
        "from": "p",
        "to": "r",
        "label": "기타"
      },
      {
        "from": "a",
        "to": "u"
      },
      {
        "from": "r",
        "to": "u",
        "label": "환불 동의·등록"
      },
      {
        "from": "r",
        "to": "v",
        "label": "환불 미동의"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 41,
    "title": "서비스대행업체 안내",
    "displayTitle": "서비스 대행업체 안내",
    "phase": "2차",
    "category": "AS·케어",
    "summary": "서비스 대행업체 문의",
    "keywords": [
      "서비스 대행업체",
      "대행 수리",
      "타사 서비스",
      "어디에서 수리",
      "가스레인지 수리",
      "서비스센터 어디",
      "서비스 센터 위치",
      "AS 센터 연락처",
      "대행 업체",
      "옥션 제품 수리",
      "어디에 수리를",
      "가스레인지 AS 어디"
    ],
    "intentRules": [
      [
        [
          "서비스센터",
          "서비스 센터",
          "대행업체",
          "서비스 업체",
          "수리센터",
          "AS센터",
          "수리"
        ],
        [
          "어디",
          "위치",
          "연락처",
          "전화번호",
          "번호",
          "업체"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "i",
        "condition": "서비스 대행업체 문의 및 제품 확인",
        "message": "서비스 문의를 하실 제품의 종류와 모델명을 알려 주세요.",
        "kind": "input",
        "placeholder": "제품 종류 또는 모델명",
        "customer": "이 가스레인지는 어디에 수리 신청해야 하나요?"
      },
      {
        "id": "s2",
        "stepId": "k",
        "condition": "경동나비엔 양도 대상 제품",
        "message": "직수 정수기 AS는 경동나비엔 고객센터에서 접수해요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 담당 업체",
            "detail": "경동나비엔"
          }
        ],
        "demo": true
      },
      {
        "id": "s3",
        "stepId": "r",
        "condition": "경동나비엔 연락처 문자 발송 의사 확인",
        "message": "경동나비엔 고객상담센터 연락처를 문자로 보내드릴까요?",
        "kind": "choice",
        "options": [
          "문자로 받기",
          "문자 필요 없음"
        ]
      },
      {
        "id": "s4",
        "stepId": "u",
        "condition": "경동나비엔 연락처 SMS 발송 완료",
        "message": "경동나비엔 고객상담센터 연락처를 문자로 보내드렸어요.",
        "kind": "result"
      },
      {
        "id": "s5",
        "stepId": "p",
        "condition": "필립스 커피·에스프레소 머신",
        "message": "필립스 커피·에스프레소 머신의 서비스 접수는 필립스 고객센터에 문의해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 연락처",
            "detail": "1661-0083"
          }
        ]
      },
      {
        "id": "s6",
        "stepId": "a",
        "condition": "삼성전자 서비스 담당 제품",
        "message": "해당 제품의 서비스 접수는 삼성전자 서비스에 문의해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "서비스 연락처",
            "detail": "1588-3366"
          }
        ]
      },
      {
        "id": "s7",
        "stepId": "h",
        "condition": "대행업체 대상 외 또는 예외 모델",
        "message": "직수 정수기의 서비스 접수를 이어서 확인할게요. 다음 단계에서 제품 정보를 확인해 주세요.",
        "kind": "handoff",
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "d"
      },
      {
        "from": "d",
        "to": "k",
        "label": "경동나비엔"
      },
      {
        "from": "d",
        "to": "p",
        "label": "필립스 커피·에스프레소 머신"
      },
      {
        "from": "d",
        "to": "a",
        "label": "삼성전자 제품"
      },
      {
        "from": "d",
        "to": "h",
        "label": "그 외·예외 모델"
      },
      {
        "from": "k",
        "to": "r"
      },
      {
        "from": "r",
        "to": "u",
        "label": "문자 요청"
      },
      {
        "from": "r",
        "to": "v",
        "label": "구두 안내"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "p",
        "to": "v"
      },
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      },
      {
        "from": "h",
        "to": "e"
      }
    ]
  },
  {
    "no": 42,
    "title": "멤버십 자동연장 거부 요청",
    "displayTitle": "멤버십 자동연장 거부",
    "phase": "2차",
    "category": "계약·해약",
    "summary": "멤버십 연장·거부 문의",
    "keywords": [
      "자동연장 거부",
      "연장 안함",
      "자동갱신 취소",
      "자동연장 안 할래요",
      "멤버십 연장",
      "자동 연장 거부",
      "자동으로 연장 안",
      "자동 연장 안",
      "자동 연장 취소",
      "자동갱신 거부",
      "멤버십 안 늘리",
      "멤버십 연장 거절"
    ],
    "intentRules": [
      [
        [
          "멤버십",
          "자동연장",
          "자동 연장",
          "자동갱신",
          "자동 갱신"
        ],
        [
          "연장되지 않",
          "연장하지 않",
          "연장 안",
          "거부",
          "갱신 안",
          "거절",
          "자동 갱신 취소",
          "이번 만기까지만"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "멤버십 요청 유형 확인",
        "message": "멤버십의 어떤 내용을 확인해 드릴까요?",
        "kind": "choice",
        "options": [
          "연장 여부 확인",
          "자동연장 거부",
          "멤버십 해약 문의"
        ],
        "customer": "이번 만기까지만 쓰고 자동연장은 안 할래요."
      },
      {
        "id": "s2",
        "stepId": "x",
        "condition": "조회 권한 또는 계약 정보 확인 불가",
        "message": "이 멤버십 계약 정보를 확인할 수 없어요. 계약자 또는 법인 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s3",
        "stepId": "a",
        "condition": "연장 기준·최종 만료 조회",
        "message": "직수 정수기 멤버십의 만료 예정월은 2026년 12월이에요. 멤버십은 갱신 시 연체가 없으면 최초 설치일부터 최대 7년까지 연장할 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "만료 예정월",
            "detail": "2026년 12월"
          },
          {
            "title": "갱신 상태",
            "detail": "자동연장 예정"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "d",
        "condition": "원복 불가 안내 후 동의 요청",
        "message": "자동연장을 거부하면 2026년 12월에 멤버십이 만료돼요. 거부 처리를 완료한 뒤에는 기존 상태로 되돌릴 수 없어요. 계속할까요?",
        "kind": "choice",
        "options": [
          "자동연장 거부에 동의",
          "유지하기"
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "u",
        "condition": "자동연장 제외 등록 완료",
        "message": "직수 정수기 멤버십의 자동연장 거부가 등록됐어요.",
        "kind": "result",
        "items": [
          {
            "title": "만료 예정월",
            "detail": "2026년 12월"
          },
          {
            "title": "자동연장",
            "detail": "제외"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "h",
        "condition": "즉시 해약 요청",
        "message": "멤버십 해약은 상담사가 신청 내용을 확인해 드릴게요.",
        "kind": "handoff"
      },
      {
        "id": "s7",
        "stepId": "m",
        "condition": "최종만료 및 교체 구독 상담 희망",
        "message": "교체 구독 상담을 요청하신 내용을 담당 지국에 전달할게요.",
        "kind": "handoff"
      },
      {
        "id": "E7",
        "stepId": "r",
        "condition": "자동연장 거부 선택 · 이번 계약 만료 시점 안내",
        "message": "자동연장을 거부하면 이번 계약은 만료 예정일에 종료돼요. 처리 후에는 기존 연장 상태로 되돌릴 수 없어요.",
        "kind": "result"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "t",
        "label": "일치"
      },
      {
        "from": "t",
        "to": "q",
        "label": "연장 사실·연장 요청·연장거부"
      },
      {
        "from": "t",
        "to": "h",
        "label": "즉시 해약"
      },
      {
        "from": "q",
        "to": "a",
        "label": "갱신·연장 사실 문의"
      },
      {
        "from": "q",
        "to": "r",
        "label": "자동연장 거부"
      },
      {
        "from": "a",
        "to": "m",
        "label": "최종만료·교체 상담 의사"
      },
      {
        "from": "a",
        "to": "v",
        "label": "일반 안내"
      },
      {
        "from": "r",
        "to": "d"
      },
      {
        "from": "d",
        "to": "u",
        "label": "동의"
      },
      {
        "from": "d",
        "to": "v",
        "label": "미동의"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "m",
        "to": "e"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 43,
    "title": "배송단순문의_사은품 확인/일정문의",
    "displayTitle": "사은품 확인·배송 일정",
    "phase": "3차",
    "category": "배송·설치",
    "summary": "사은품 확인·일정 문의",
    "keywords": [
      "사은품",
      "사은품 배송",
      "사은품 확인",
      "혜택 배송",
      "사은품 변경",
      "사은품 불량",
      "사은품 언제",
      "사은품이 안 왔",
      "증정품",
      "상품권 언제",
      "증정 사은품",
      "사은품 받기로",
      "사은품이 불량",
      "사은품 교환"
    ],
    "intentRules": [
      [
        [
          "사은품",
          "증정품",
          "상품권",
          "구매 혜택"
        ],
        [
          "언제",
          "배송",
          "주문",
          "안 왔",
          "파손",
          "발송",
          "받",
          "불량",
          "변경",
          "교환",
          "오나요"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "사은품 문의 종류 확인",
        "message": "사은품과 관련해서 어떤 도움이 필요하세요?",
        "kind": "choice",
        "options": [
          "혜택 종류·발송일",
          "사은품 변경",
          "불량 또는 판매처 문의",
          "주문하지 않은 택배"
        ],
        "customer": "설치할 때 받기로 한 사은품은 언제 오나요?"
      },
      {
        "id": "s2",
        "stepId": "x",
        "condition": "계약 정보 확인 불가",
        "message": "계약 정보를 확인할 수 없어 사은품을 안내하기 어려워요. 계약자 정보를 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s3",
        "stepId": "a",
        "condition": "혜택 및 일정의 근거 확인 완료",
        "message": "직수 정수기 주문에서 확인된 혜택은 구독 포인트이에요.",
        "kind": "result",
        "items": [
          {
            "title": "설치 완료일",
            "detail": "2026년 11월 20일"
          },
          {
            "title": "발송 또는 적립 예정",
            "detail": "2026년 12월 5일 지급 예정"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "c",
        "condition": "사은품 변경 요청 접수",
        "message": "받으신 사은품을 개봉하거나 사용하셨나요?",
        "kind": "choice",
        "options": [
          "개봉 또는 사용했어요",
          "아직 개봉하거나 사용하지 않았어요"
        ]
      },
      {
        "id": "s5",
        "stepId": "n",
        "condition": "사은품 개봉·사용 확인",
        "message": "개봉하거나 사용한 사은품은 변경하기 어려워요.",
        "kind": "exception"
      },
      {
        "id": "s6",
        "stepId": "p",
        "condition": "주문하지 않은 택배 수령",
        "message": "택배 송장의 받는 분 성함과 배송지, 주문 내역이 일치하는지 확인해 주세요. 일치하지 않으면 송장에 적힌 판매자나 택배사에 반송 방법을 문의해 주세요.",
        "kind": "input",
        "items": [
          {
            "title": "확인할 내용",
            "detail": "송장 수령인·주소·연락처와 주문 내역"
          }
        ],
        "placeholder": "확인한 수령 정보"
      },
      {
        "id": "s7",
        "stepId": "h",
        "condition": "판매부서 후속 확인 필요",
        "message": "판매 부서에서 혜택 내용이나 처리 가능 여부를 확인하도록 문의를 전달할게요. 제품 불량이라면 상태를 확인할 수 있는 사진을 준비해 주세요.",
        "kind": "handoff"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "t",
        "label": "일치"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "t",
        "to": "q",
        "label": "혜택 종류·제공일"
      },
      {
        "from": "t",
        "to": "c",
        "label": "사은품 변경"
      },
      {
        "from": "t",
        "to": "p",
        "label": "미주문 택배"
      },
      {
        "from": "t",
        "to": "h",
        "label": "불량·판매처 연락"
      },
      {
        "from": "q",
        "to": "a",
        "label": "근거 확인"
      },
      {
        "from": "q",
        "to": "h",
        "label": "이벤트 정보 확인 필요"
      },
      {
        "from": "c",
        "to": "n",
        "label": "개봉·사용"
      },
      {
        "from": "c",
        "to": "h",
        "label": "미개봉·미사용"
      },
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "n",
        "to": "v"
      },
      {
        "from": "p",
        "to": "v"
      },
      {
        "from": "h",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 44,
    "title": "배송단순문의_설치환경문의",
    "displayTitle": "설치환경 문의",
    "phase": "2차",
    "category": "배송·설치",
    "summary": "설치 환경 문의",
    "keywords": [
      "설치환경",
      "설치 가능 여부",
      "타공",
      "호스 길이",
      "싱크대 설치",
      "설치 가능한지",
      "타공 규격",
      "구멍 크기",
      "싱크대 타공",
      "설치할 수 있",
      "상판 뚫",
      "공간 좁은데 설치",
      "설치 조건",
      "설치 공간"
    ],
    "intentRules": [
      [
        [
          "설치",
          "타공",
          "호스"
        ],
        [
          "싱크대",
          "공간",
          "상판",
          "구멍",
          "환경",
          "규격",
          "호스",
          "좁아",
          "가능",
          "조건"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "설치환경 문의 종류 확인",
        "message": "설치 환경에서 어떤 점이 궁금하세요?",
        "kind": "choice",
        "options": [
          "설치 가능 여부",
          "타공 크기·호스",
          "재설치 방문"
        ],
        "customer": "이 싱크대에 정수기를 설치할 수 있을까요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "제품 모델 및 설치 환경 확인",
        "message": "제품의 모델명과 설치하려는 장소를 알려 주세요.",
        "kind": "input",
        "placeholder": "예: 정수기 모델명, 싱크대 상판"
      },
      {
        "id": "s3",
        "stepId": "m",
        "condition": "모델별 타공·호스 기준 미확정",
        "message": "필요한 구멍 크기와 호스는 모델마다 달라요. 이 모델의 정확한 규격은 추가 확인이 필요해요.",
        "kind": "exception"
      },
      {
        "id": "s4",
        "stepId": "a",
        "condition": "현장 설치 가능 판단 필요",
        "message": "설치 가능 여부는 서비스 매니저가 현장을 확인한 뒤 안내해요. 방문 후 설치가 어려워 취소하더라도 출장료가 발생할 수 있어요.",
        "kind": "result"
      },
      {
        "id": "s5",
        "stepId": "d",
        "condition": "현장 확인 안내 후 접수 의사 확인",
        "message": "재설치 방문을 접수할까요?",
        "kind": "choice",
        "options": [
          "재설치 방문 접수",
          "안내만 받기"
        ]
      },
      {
        "id": "s6",
        "stepId": "r",
        "condition": "재설치 접수 정보 입력",
        "message": "설치 주소와 방문 희망일, 연락처를 확인해 주세요. 정수기라면 조리수 밸브도 함께 설치할지 알려 주세요.",
        "kind": "input",
        "items": [
          {
            "title": "재설치 예상 비용",
            "detail": "35,000원"
          }
        ],
        "placeholder": "설치 주소 또는 방문 희망일",
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "u",
        "condition": "재설치 접수 및 알림톡 발송 확인",
        "message": "직수 정수기 재설치를 접수했어요. 접수 정보는 알림톡에서도 확인하실 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "방문 희망일",
            "detail": "2026년 12월 2일(수)"
          }
        ],
        "demo": true
      },
      {
        "id": "s8",
        "stepId": "p",
        "condition": "재설치 접수 후 별도 사전 연락 확인",
        "message": "서비스 매니저에게 방문 전 별도 연락을 요청할까요?",
        "kind": "choice",
        "options": [
          "사전 연락 요청",
          "추가 요청 없음"
        ]
      },
      {
        "id": "E8",
        "stepId": "h",
        "condition": "접수 후 방문 전 사전 연락 요청",
        "message": "방문 전에 먼저 연락을 받으실 수 있도록 사전 연락 요청 방법을 안내해드릴게요.",
        "kind": "handoff",
        "options": [
          "사전 연락 요청"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "t"
      },
      {
        "from": "t",
        "to": "m",
        "label": "타공 크기·호스 구성"
      },
      {
        "from": "t",
        "to": "a",
        "label": "설치 가능 여부·일반 타공 문의"
      },
      {
        "from": "m",
        "to": "a",
        "label": "모델 기준 미정·현장 확인"
      },
      {
        "from": "m",
        "to": "d",
        "label": "확정된 기준 안내"
      },
      {
        "from": "a",
        "to": "d"
      },
      {
        "from": "d",
        "to": "q",
        "label": "접수 희망"
      },
      {
        "from": "d",
        "to": "v",
        "label": "안내만"
      },
      {
        "from": "q",
        "to": "r"
      },
      {
        "from": "r",
        "to": "u"
      },
      {
        "from": "u",
        "to": "p"
      },
      {
        "from": "p",
        "to": "h",
        "label": "요청"
      },
      {
        "from": "p",
        "to": "v",
        "label": "없음"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 45,
    "title": "요금 납부_선납관련",
    "displayTitle": "선납 금액·할인 문의",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "구독료 선납 문의·요청",
    "keywords": [
      "선납",
      "미리 납부",
      "선납 할인",
      "선납 견적",
      "선납 영수증",
      "일시납",
      "구독료 한꺼번에",
      "미리 결제",
      "미리 내면",
      "남은 구독료 한꺼번에",
      "잔여 구독료 완납",
      "선납하면 할인",
      "남은 요금 미리",
      "구독료 일시납"
    ],
    "intentRules": [
      [
        [
          "요금",
          "렌탈료",
          "선납",
          "구독료"
        ],
        [
          "먼저",
          "미리",
          "한꺼번에",
          "일시불",
          "일시납"
        ],
        [
          "내",
          "결제",
          "납부",
          "완납",
          "할인",
          "금액"
        ]
      ],
      [
        [
          "앞으로",
          "남은",
          "잔여"
        ],
        [
          "요금",
          "렌탈료",
          "구독료"
        ],
        [
          "내",
          "결제",
          "납부",
          "완납",
          "할인",
          "금액"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "선납 업무 확인",
        "message": "선납 관련해서 무엇을 도와드릴까요?",
        "kind": "choice",
        "options": [
          "선납 금액·할인 확인",
          "선납 견적서·영수증",
          "선납 취소 문의"
        ],
        "customer": "남은 구독료를 한꺼번에 내면 할인되나요?"
      },
      {
        "id": "s2",
        "stepId": "x",
        "condition": "계약 정보 확인 불가",
        "message": "계약 정보를 확인할 수 없어 선납 금액이나 서류를 안내하기 어려워요. 계약자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s3",
        "stepId": "r",
        "condition": "계약 유형별 검증된 조건과 예상금액 조회",
        "message": "직수 정수기 계약의 선납 조건을 확인했어요. 적용 기간과 할인율을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "선납 적용 기간",
            "detail": "12개월"
          },
          {
            "title": "할인율",
            "detail": "4%"
          },
          {
            "title": "수납 예정금액",
            "detail": "344,448원"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "c",
        "condition": "예상 금액 안내 후 고객 선택",
        "message": "선납을 진행할까요? 금액을 비교하려면 견적서를 먼저 받을 수 있어요.",
        "kind": "choice",
        "options": [
          "선납 진행",
          "견적서 받기",
          "안내만 받기"
        ]
      },
      {
        "id": "s5",
        "stepId": "b",
        "condition": "선납 등록 전 세금계산서 발행 의사 확인",
        "message": "결제를 진행하기 전에 선납 세금계산서 발행 여부를 선택해 주세요.",
        "kind": "choice",
        "options": [
          "세금계산서 발행",
          "발행하지 않기"
        ]
      },
      {
        "id": "s6",
        "stepId": "f",
        "condition": "선납 신청 후 결제 대기",
        "message": "선납 결제가 완료되어야 영수증을 발송할 수 있어요. 지금은 견적서를 받을 수 있어요.",
        "kind": "exception",
        "options": [
          "견적서 받기"
        ]
      },
      {
        "id": "s7",
        "stepId": "m",
        "condition": "상태별 발송 가능한 선납 문서 발송 완료",
        "message": "요청하신 선납 견적서를 이메일으로 보냈어요.",
        "kind": "result",
        "items": [
          {
            "title": "발송 문서",
            "detail": "선납 견적서"
          }
        ],
        "demo": true
      },
      {
        "id": "s8",
        "stepId": "a",
        "condition": "선납 취소 조건 확인",
        "message": "선납 취소는 해약이나 명의변경 시에 처리할 수 있어요. 할인받은 금액의 일부 또는 전부를 반환해야 할 수 있어요.",
        "kind": "result"
      },
      {
        "id": "E8",
        "stepId": "h",
        "condition": "해약 또는 명의변경을 같이 요청",
        "message": "선납금이 있는 계약을 해약하거나 명의변경하시려면 해당 업무에서 계약 조건을 먼저 확인해 주세요.",
        "kind": "handoff",
        "options": [
          "해약 문의",
          "명의변경 문의"
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "미확인"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "t",
        "label": "확인"
      },
      {
        "from": "t",
        "to": "q",
        "label": "선납·견적·영수증·계산서"
      },
      {
        "from": "t",
        "to": "a",
        "label": "선납 취소"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "r",
        "label": "선납 신규·할인"
      },
      {
        "from": "d",
        "to": "f",
        "label": "문서 요청"
      },
      {
        "from": "r",
        "to": "c"
      },
      {
        "from": "c",
        "to": "b",
        "label": "수납 요청"
      },
      {
        "from": "c",
        "to": "f",
        "label": "견적서만"
      },
      {
        "from": "c",
        "to": "v",
        "label": "안내로 종료"
      },
      {
        "from": "b",
        "to": "f"
      },
      {
        "from": "f",
        "to": "m",
        "label": "발송 가능·요청"
      },
      {
        "from": "f",
        "to": "v",
        "label": "미결제 또는 발송 조건 미충족"
      },
      {
        "from": "m",
        "to": "v"
      },
      {
        "from": "a",
        "to": "h",
        "label": "해약·명의변경 진행"
      },
      {
        "from": "a",
        "to": "v",
        "label": "조건 안내"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 46,
    "title": "요금 납부_선납관련_설치 취소 환불",
    "displayTitle": "설치 취소 후 선납 환불",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "설치 취소·선납 환불 문의",
    "keywords": [
      "설치 취소 환불",
      "설치 전 환불",
      "선납 환불",
      "선납한 돈 환불",
      "설치 취소했는데 환불",
      "설치 취소 선납",
      "설치 환불",
      "선납금 환불",
      "돈은 언제 환불",
      "설치 주문 취소한 환불"
    ],
    "intentRules": [
      [
        [
          "설치",
          "주문"
        ],
        [
          "취소",
          "철회"
        ],
        [
          "환불",
          "선납금",
          "미리 낸 돈",
          "환급"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "설치 취소·선납 환불 문의",
        "message": "설치 주문을 취소할지, 이미 요청하신 환불을 확인할지 알려 주세요.",
        "kind": "intro",
        "options": [
          "설치 주문 취소",
          "선납 환불 확인"
        ],
        "customer": "설치 전에 취소했는데 선납한 돈은 언제 환불되나요?"
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "대상 주문 확인 필요",
        "message": "설치받으실 분의 성함, 연락처, 주소를 확인해 주세요. 조회된 주문에서 해당 제품을 선택해 주세요.",
        "kind": "input",
        "placeholder": "설치받으실 분 정보 또는 주문 선택"
      },
      {
        "id": "s3",
        "stepId": "h",
        "condition": "설치 전 주문취소 실행 필요",
        "message": "주문취소 절차로 이어갈게요. 배송 상태에 따라 설치 담당자가 취소 가능 여부를 확인할 수 있어요.",
        "kind": "handoff",
        "items": [
          {
            "title": "대상 주문",
            "detail": "직수 정수기 · DL-261125-001"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "a",
        "condition": "가상계좌 선납 및 환불정보 조회 확인",
        "message": "선납 금액은 주문할 때 등록하신 계좌로 환불될 예정이에요. 확인된 계좌와 예정일을 안내해 드릴게요.",
        "kind": "result",
        "items": [
          {
            "title": "환불 계좌",
            "detail": "예시은행 ••••-••••-1234"
          },
          {
            "title": "환불 예정일",
            "detail": "2026년 12월 1일(화)"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "c",
        "condition": "카드 선납 취소 상태 확인",
        "message": "카드 결제 취소는 영업일 기준 5일 이내에 카드사 문자나 결제 내역에서 확인할 수 있어요.",
        "kind": "result",
        "items": [
          {
            "title": "납부 방법",
            "detail": "카드"
          }
        ]
      },
      {
        "id": "s6",
        "stepId": "n",
        "condition": "선납 납부 또는 환불등록 상태 미확인",
        "message": "이 주문의 선납 환불 상태를 아직 확인할 수 없어요. 환불 예정일이나 계좌는 환불 확인 후 안내할 수 있어요.",
        "kind": "exception"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "o"
      },
      {
        "from": "o",
        "to": "d"
      },
      {
        "from": "d",
        "to": "h",
        "label": "설치 전 주문취소"
      },
      {
        "from": "d",
        "to": "q",
        "label": "환불 문의"
      },
      {
        "from": "h",
        "to": "q",
        "label": "환불관리 확인 필요"
      },
      {
        "from": "h",
        "to": "v",
        "label": "주문취소 요청만"
      },
      {
        "from": "q",
        "to": "p"
      },
      {
        "from": "p",
        "to": "a",
        "label": "가상계좌"
      },
      {
        "from": "p",
        "to": "c",
        "label": "카드"
      },
      {
        "from": "p",
        "to": "n",
        "label": "납부·환불 확인 불가"
      },
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "c",
        "to": "v"
      },
      {
        "from": "n",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 47,
    "title": "수납정보관련_환불등록/이력 문의",
    "displayTitle": "환불 등록·이력 문의",
    "phase": "3차",
    "category": "결제·납부",
    "summary": "환불 등록·진행 문의",
    "keywords": [
      "환불 등록",
      "환불 이력",
      "환불 일정",
      "환불 문의",
      "환불 계좌",
      "환불 언제",
      "가상계좌 오입금",
      "환불금 입금",
      "환불 어디",
      "환불금 들어",
      "환불 날짜",
      "환불 조회",
      "환불 상태 확인",
      "잘못 송금",
      "잘못 입금",
      "환불 진행",
      "환불해 준다고"
    ],
    "intentRules": [
      [
        [
          "환불",
          "환급",
          "오입금",
          "잘못 이체",
          "잘못 송금"
        ],
        [
          "언제",
          "들어오",
          "일정",
          "날짜",
          "계좌",
          "확인",
          "조회",
          "잘못",
          "돈",
          "언제까지"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "t",
        "condition": "환불 문의 세부 유형 확인",
        "message": "어떤 환불을 확인해 드릴까요?",
        "kind": "choice",
        "options": [
          "환불 일정·계좌 확인",
          "제휴카드로 다시 결제",
          "교체·전환·명의변경",
          "가상계좌 오입금"
        ],
        "customer": "환불해 준다고 했는데 언제 들어오나요?"
      },
      {
        "id": "s2",
        "stepId": "x",
        "condition": "계약 조회·권한 확인 불가",
        "message": "계약 정보를 확인할 수 없어 환불 내역을 안내하기 어려워요. 계약자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s3",
        "stepId": "a",
        "condition": "환불관리 상태 조회 일치",
        "message": "확인된 환불 상태는 처리 중예요.",
        "kind": "result",
        "items": [
          {
            "title": "환불 금액",
            "detail": "29,900원"
          },
          {
            "title": "환불 계좌",
            "detail": "예시은행 ••••-••••-1234"
          },
          {
            "title": "예정일 또는 완료일",
            "detail": "2026년 11월 25일"
          }
        ],
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "j",
        "condition": "제휴카드 재결제 요청 당일 결제",
        "message": "오늘 결제된 건은 다음 날부터 확인할 수 있어요. 해당 결제가 재결제 대상인지 추가로 확인해야 해요.",
        "kind": "exception"
      },
      {
        "id": "s5",
        "stepId": "p",
        "condition": "제휴카드 재결제 대상 · 납부정보 변경 필요",
        "message": "제휴카드로 다시 결제하려면 먼저 납부 정보를 변경해야 해요. 카드 정보는 다음 단계의 보안 절차에서 입력해 주세요.",
        "kind": "handoff"
      },
      {
        "id": "s6",
        "stepId": "u",
        "condition": "환불 요건 충족 및 계약자 계좌 확인",
        "message": "중복 납부로 확인된 환불 금액은 29,900원이에요. 계약자 명의의 계좌로만 환불할 수 있어요.",
        "kind": "input",
        "items": [
          {
            "title": "확인할 정보",
            "detail": "계약자 명의 환불 계좌"
          }
        ],
        "placeholder": "환불 계좌 확인",
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "g",
        "condition": "가상계좌 오입금 확인 및 증빙 필요",
        "message": "환불 신청에 필요한 자료를 준비해 주세요. 서류 제출 방법은 별도로 안내해 드릴게요.",
        "kind": "input",
        "items": [
          {
            "title": "준비할 자료",
            "detail": "환불 사유에 따라 필요한 증빙 서류"
          }
        ],
        "placeholder": ""
      },
      {
        "id": "s8",
        "stepId": "h",
        "condition": "증빙 검토 또는 추가 상담 필요",
        "message": "상담사가 입금과 환불 조건을 확인할 수 있도록 문의를 전달할게요. 검토 후 환불 가능 여부를 안내받을 수 있어요.",
        "kind": "handoff"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "t",
        "label": "일치"
      },
      {
        "from": "t",
        "to": "q",
        "label": "환불이력·일정"
      },
      {
        "from": "t",
        "to": "j",
        "label": "제휴카드 재결제"
      },
      {
        "from": "t",
        "to": "r",
        "label": "교체구독·전환멤버십·명의변경"
      },
      {
        "from": "t",
        "to": "g",
        "label": "가상계좌 오입금"
      },
      {
        "from": "q",
        "to": "a"
      },
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "j",
        "to": "h",
        "label": "당일 결제·추가 확인"
      },
      {
        "from": "j",
        "to": "p",
        "label": "당월 재결제 진행"
      },
      {
        "from": "j",
        "to": "a",
        "label": "당월 취소 불가·다음 달 변경 안내"
      },
      {
        "from": "p",
        "to": "b",
        "label": "기존 카드"
      },
      {
        "from": "p",
        "to": "u",
        "label": "기존 CMS"
      },
      {
        "from": "b",
        "to": "v"
      },
      {
        "from": "r",
        "to": "u",
        "label": "등록 요건 충족"
      },
      {
        "from": "r",
        "to": "h",
        "label": "추가 확인 또는 해약 처리"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "g",
        "to": "h"
      },
      {
        "from": "h",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 48,
    "title": "현금영수증 발행/발급 확인",
    "displayTitle": "현금영수증 발행·확인",
    "phase": "3차",
    "category": "문서발송",
    "summary": "현금영수증 발행·확인 문의",
    "keywords": [
      "현금영수증",
      "현금 영수증",
      "현금영수증 발급",
      "현금영수증 발행",
      "소득공제 증빙",
      "현금으로 결제한 영수증",
      "현금영수증 이메일",
      "현금영수증 신청",
      "현금영수증 조회",
      "현금 증빙",
      "현금 거래 영수증",
      "소득공제 발급"
    ],
    "intentRules": [
      [
        [
          "현금영수증",
          "현금 영수증",
          "소득공제",
          "현금"
        ],
        [
          "영수증",
          "소득공제",
          "증빙"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "현금영수증 문의 시작",
        "message": "현금영수증 발행 여부, 발급 내역 또는 발행 신청을 확인해 드릴게요.",
        "kind": "intro",
        "options": [
          "발행 여부 확인",
          "영수증 받기",
          "새로 발행 신청"
        ],
        "customer": "이번 달 현금영수증을 이메일로 받을 수 있나요?"
      },
      {
        "id": "s2",
        "stepId": "x",
        "condition": "계약 조회·권한 확인 불가",
        "message": "계약 정보를 확인할 수 없어 현금영수증 내역을 안내하기 어려워요. 계약자 정보를 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s3",
        "stepId": "p",
        "condition": "카드 결제 또는 세금계산서 발행 계약",
        "message": "이 계약은 카드 결제 상태여서 현금영수증을 발행할 수 없어요.",
        "kind": "exception",
        "demo": true
      },
      {
        "id": "s4",
        "stepId": "h",
        "condition": "현금영수증 발행을 위한 납부방법 변경 요청",
        "message": "다음 달부터 현금영수증을 받으려면 납부 방법을 변경해야 해요. 납부방법 변경 절차로 이어갈게요.",
        "kind": "handoff"
      },
      {
        "id": "s5",
        "stepId": "r",
        "condition": "발행된 현금영수증 승인건 확인",
        "message": "2026년 11월 25일에 발행된 현금영수증을 확인했어요. 어떤 방법으로 보내드릴까요?",
        "kind": "result",
        "options": [
          "알림톡",
          "이메일",
          "팩스"
        ],
        "items": [
          {
            "title": "발행일",
            "detail": "2026년 11월 25일"
          },
          {
            "title": "거래 상태",
            "detail": "승인"
          }
        ],
        "demo": true
      },
      {
        "id": "s6",
        "stepId": "f",
        "condition": "승인건 영수증 발송 완료",
        "message": "현금영수증을 요청하신 이메일으로 보냈어요. 정기 발송 서비스는 운영하지 않아요.",
        "kind": "result",
        "demo": true
      },
      {
        "id": "s7",
        "stepId": "n",
        "condition": "적용 가능 계약에서 현금영수증 미발행",
        "message": "현재 이 계약은 현금영수증 미발행 상태예요. 앞으로 현금영수증이 발행되도록 변경할까요?",
        "kind": "choice",
        "options": [
          "발행으로 변경",
          "현재 상태 유지"
        ]
      },
      {
        "id": "s8",
        "stepId": "a",
        "condition": "전월분 소급 요청 확인",
        "message": "소급발행은 매월 10일 이내에 전월분만 요청할 수 있어요. 발행 가능 내역을 확인해 주세요.",
        "kind": "result",
        "items": [
          {
            "title": "대상",
            "detail": "2026년 10월 결제분"
          },
          {
            "title": "처리 상태",
            "detail": "발행 조건 확인"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "k"
      },
      {
        "from": "k",
        "to": "x",
        "label": "불일치"
      },
      {
        "from": "x",
        "to": "v"
      },
      {
        "from": "k",
        "to": "q",
        "label": "일치"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "p",
        "label": "카드·세금계산서"
      },
      {
        "from": "d",
        "to": "r",
        "label": "발행 상태·발급 확인"
      },
      {
        "from": "d",
        "to": "n",
        "label": "미발행·발행 요청"
      },
      {
        "from": "p",
        "to": "h",
        "label": "납부방법 변경 희망"
      },
      {
        "from": "p",
        "to": "v",
        "label": "안내만"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "r",
        "to": "f",
        "label": "발송 희망·승인건"
      },
      {
        "from": "r",
        "to": "v",
        "label": "상태 확인만"
      },
      {
        "from": "f",
        "to": "v"
      },
      {
        "from": "n",
        "to": "c",
        "label": "동의"
      },
      {
        "from": "n",
        "to": "v",
        "label": "미동의"
      },
      {
        "from": "c",
        "to": "b"
      },
      {
        "from": "b",
        "to": "a",
        "label": "전월분 소급 요청·기한 내"
      },
      {
        "from": "b",
        "to": "v",
        "label": "일반 신청·기한 경과: 신청월부터"
      },
      {
        "from": "a",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 49,
    "title": "마케팅 활용 동의/철회",
    "displayTitle": "마케팅 활용 동의·철회",
    "phase": "2차",
    "category": "고객정보·동의",
    "summary": "마케팅 활용 동의·철회 요청",
    "keywords": [
      "마케팅 동의",
      "마케팅 철회",
      "광고 문자 차단",
      "광고 수신 거부",
      "광고성 메시지",
      "홍보 연락",
      "광고 동의 철회",
      "문자 차단",
      "홍보 문자 안 받",
      "광고 안 받",
      "광고 문자 그만",
      "홍보 수신 거부",
      "마케팅 거부",
      "정보 활용 동의",
      "광고성 연락"
    ],
    "intentRules": [
      [
        [
          "광고",
          "마케팅",
          "홍보",
          "프로모션",
          "영리성",
          "정보 활용"
        ],
        [
          "철회",
          "취소",
          "차단",
          "거부",
          "중단",
          "그만",
          "안 받",
          "받기 싫",
          "동의"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "마케팅 활용 동의 확인 또는 철회",
        "message": "마케팅 동의 상태를 확인하거나 변경해 드릴게요.",
        "kind": "intro",
        "customer": "광고성 메시지 받는 데 동의한 걸 철회하고 싶어요."
      },
      {
        "id": "s2",
        "stepId": "i",
        "condition": "고객 정보 확인 · 휴대폰 인증 필요",
        "message": "동의 상태를 확인할 휴대폰 번호와 성함을 입력한 뒤 휴대폰 확인을 진행해 주세요.",
        "kind": "input",
        "placeholder": "",
        "fields": [
          {
            "label": "이름",
            "value": "이름 입력"
          },
          {
            "label": "휴대폰 번호",
            "value": "010-••••-1234"
          }
        ],
        "options": [
          "휴대폰 확인"
        ],
        "demo": true
      },
      {
        "id": "s3",
        "stepId": "n",
        "condition": "일치하는 고객 정보 없음",
        "message": "말씀해 주신 연락처로 조회되는 정보가 없어요. 등록하신 휴대폰번호와 성함을 다시 확인해 주세요.",
        "kind": "exception"
      },
      {
        "id": "s4",
        "stepId": "a",
        "condition": "회사별·항목별 현재 동의 상태 조회",
        "message": "변경할 회사와 동의 항목을 확인해 주세요.",
        "kind": "choice",
        "options": [
          "동의하기",
          "동의 철회",
          "현재 상태 유지"
        ],
        "items": [
          {
            "title": "회사",
            "detail": "SK매직"
          },
          {
            "title": "마케팅 활용",
            "detail": "동의"
          },
          {
            "title": "영리성 정보 수신",
            "detail": "동의"
          }
        ],
        "demo": true
      },
      {
        "id": "s5",
        "stepId": "u",
        "condition": "고객 요청에 따른 상태 변경 완료",
        "message": "SK매직의 마케팅 정보 수신 동의 상태를 변경했어요.",
        "kind": "result",
        "items": [
          {
            "title": "변경 결과",
            "detail": "미동의"
          }
        ],
        "demo": true
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "i"
      },
      {
        "from": "i",
        "to": "q"
      },
      {
        "from": "q",
        "to": "d"
      },
      {
        "from": "d",
        "to": "n",
        "label": "조회 없음"
      },
      {
        "from": "n",
        "to": "v"
      },
      {
        "from": "d",
        "to": "a",
        "label": "조회됨"
      },
      {
        "from": "a",
        "to": "u",
        "label": "동의·철회 요청"
      },
      {
        "from": "a",
        "to": "v",
        "label": "현 상태 확인만"
      },
      {
        "from": "u",
        "to": "v"
      },
      {
        "from": "v",
        "to": "e"
      }
    ]
  },
  {
    "no": 50,
    "title": "구독체결관련 심사_개인/개인사업자 기준",
    "displayTitle": "구독 체결 심사",
    "phase": "별도 검토",
    "category": "가입·심사",
    "summary": "아웃바운드 진계약 컨택",
    "keywords": [
      "구독체결심사",
      "개인사업자 심사",
      "아웃바운드 심사",
      "구독 신용 심사",
      "구독 체결 심사",
      "구독 체결 확인",
      "렌탈 심사 기준",
      "개인 사업자 심사",
      "개인사업자 구독 심사 기준"
    ],
    "intentRules": [
      [
        [
          "개인사업자",
          "개인 사업자",
          "체결",
          "아웃바운드"
        ],
        [
          "구독",
          "렌탈"
        ],
        [
          "심사",
          "심사 기준"
        ]
      ]
    ],
    "screens": [
      {
        "id": "s1",
        "stepId": "s",
        "condition": "내부용 · 별도 검토 · 아웃바운드 전용",
        "message": "구독체결 심사는 상담사가 계약자에게 연락하는 아웃바운드 업무입니다. 적용 채널과 처리 범위를 검토 중입니다.",
        "kind": "internal-only",
        "items": [
          {
            "title": "분류",
            "detail": "아웃바운드 상담사 참조"
          },
          {
            "title": "챗봇 화면",
            "detail": "정의 보류"
          },
          {
            "title": "업무 참조",
            "detail": "진계약컨택관리 · RM 체크 · 계약자 본인확인"
          }
        ]
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "q"
      },
      {
        "from": "q",
        "to": "i"
      },
      {
        "from": "i",
        "to": "b",
        "label": "부재·통화불가"
      },
      {
        "from": "i",
        "to": "r",
        "label": "통화 가능"
      },
      {
        "from": "b",
        "to": "e"
      },
      {
        "from": "r",
        "to": "j"
      },
      {
        "from": "j",
        "to": "h",
        "label": "부적합·확인 필요"
      },
      {
        "from": "j",
        "to": "a",
        "label": "충족"
      },
      {
        "from": "a",
        "to": "d"
      },
      {
        "from": "d",
        "to": "h",
        "label": "신용 기준·서류 미충족"
      },
      {
        "from": "d",
        "to": "c",
        "label": "적합"
      },
      {
        "from": "c",
        "to": "p"
      },
      {
        "from": "p",
        "to": "h",
        "label": "제품·계약 상이 등 판매처 확인"
      },
      {
        "from": "p",
        "to": "u",
        "label": "납부정보 변경"
      },
      {
        "from": "p",
        "to": "m",
        "label": "확인 완료"
      },
      {
        "from": "u",
        "to": "m"
      },
      {
        "from": "h",
        "to": "e"
      },
      {
        "from": "m",
        "to": "e"
      }
    ]
  }
];
