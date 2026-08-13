package com.realcrypto.global.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.realcrypto.adapter.out.persistence.CollectTargetRepository;
import com.realcrypto.adapter.out.persistence.CommentRepository;
import com.realcrypto.adapter.out.persistence.PostRepository;
import com.realcrypto.adapter.out.persistence.UserRepository;
import com.realcrypto.domain.CollectTarget;
import com.realcrypto.domain.community.CategoryType;
import com.realcrypto.domain.community.Comment;
import com.realcrypto.domain.community.PositionType;
import com.realcrypto.domain.community.Post;
import com.realcrypto.domain.user.User;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            CollectTargetRepository repository,
            UserRepository userRepository,
            PostRepository postRepository,
            CommentRepository commentRepository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(CollectTarget.builder()
                        .exchange("UPBIT")
                        .market("KRW-BTC")
                        .isActive(true)
                        .build());

                repository.save(CollectTarget.builder()
                        .exchange("UPBIT")
                        .market("KRW-ETH")
                        .isActive(false)
                        .build());

                repository.save(CollectTarget.builder()
                        .exchange("BINANCE")
                        .market("BTCUSDT")
                        .isActive(true)
                        .build());
            }

            // 초기 데모 유저 및 커뮤니티 샘플 글 등록
            if (userRepository.count() == 0) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                User demoUser1 = userRepository.save(User.builder()
                        .username("cryptoking")
                        .password(encoder.encode("1234"))
                        .nickname("비트의신")
                        .email("king@crypto.com")
                        .build());

                User demoUser2 = userRepository.save(User.builder()
                        .username("solanamoon")
                        .password(encoder.encode("1234"))
                        .nickname("솔라나달나라")
                        .email("sol@crypto.com")
                        .build());

                User demoUser3 = userRepository.save(User.builder()
                        .username("kimpro")
                        .password(encoder.encode("1234"))
                        .nickname("김프헌터")
                        .email("kim@crypto.com")
                        .build());

                // 1. 김프 꿀팁 글
                Post post1 = Post.builder()
                        .category(CategoryType.ARBITRAGE_INFO)
                        .position(PositionType.LONG)
                        .targetSymbol("XRP")
                        .title("🚨 업비트-바이낸스 리플(XRP) 전송 수수료 및 소요 시간 실측 팁")
                        .content("해외 거래소로 보낼 때 트론(TRX)이나 리플(XRP)이 제일 빠릅니다. 현재 업비트 리플 출금 수수료는 1 XRP이며, 바이낸스 입금까지 평균 2분 정도 걸립니다. 김프 2.5% 이상일 때 보내서 테더로 바꿔두면 무위험 차익 실현 가능합니다!")
                        .authorUsername(demoUser3.getUsername())
                        .authorNickname(demoUser3.getNickname())
                        .build();
                post1.updateLikeCounts(8, 0); // 베스트글
                postRepository.save(post1);

                commentRepository.save(Comment.builder()
                        .postId(post1.getId())
                        .authorUsername(demoUser1.getUsername())
                        .authorNickname(demoUser1.getNickname())
                        .content("좋은 정보 감사합니다! 덕분에 오늘 점심값 벌었네요 ㅎㅎ")
                        .build());

                // 2. 익절 인증 글
                Post post2 = Post.builder()
                        .category(CategoryType.PROFIT_LOSS)
                        .position(PositionType.LONG)
                        .targetSymbol("SOL")
                        .title("솔라나(SOL) 2주 홀딩 끝에 깔끔하게 +48.5% 익절 완료했습니다 🔥")
                        .content("해외 매수세 들어오는 거 보고 바이낸스에서 잡아서 업비트로 역프 넘어올 때 다 털었습니다. 수익금으로 부모님 용돈 드리고 치킨 시킵니다. 다들 성투하세요!")
                        .profitRate(48.5)
                        .authorUsername(demoUser2.getUsername())
                        .authorNickname(demoUser2.getNickname())
                        .build();
                post2.updateLikeCounts(12, 1); // 베스트글
                postRepository.save(post2);

                // 3. 코인 분석 글
                Post post3 = Post.builder()
                        .category(CategoryType.ANALYSIS)
                        .position(PositionType.NEUTRAL)
                        .targetSymbol("BTC")
                        .title("비트코인 4시간봉 주요 지지선 및 김프 과열 여부 분석")
                        .content("현재 바이낸스 기준 63k 부근 지지 테스트 중입니다. 업비트 김프가 2.6%대로 평소보다 조금 높은 편이니 신규 롱 진입은 지지 확인 후 분할 매수를 추천드립니다.")
                        .authorUsername(demoUser1.getUsername())
                        .authorNickname(demoUser1.getNickname())
                        .build();
                post3.updateLikeCounts(4, 0);
                postRepository.save(post3);

                // 4. 자유게시판 글
                Post post4 = Post.builder()
                        .category(CategoryType.FREE)
                        .position(PositionType.LONG)
                        .targetSymbol("ETH")
                        .title("오늘 장세 분위기 어떠신가요? 이더리움 슬슬 쏠 것 같은데")
                        .content("알트들 순환매 돌면서 이더리움 가스비도 살짝 오르네요. 오늘 밤 미장 열리면 위로 한번 쏴줄 것 같지 않나요?")
                        .authorUsername(demoUser2.getUsername())
                        .authorNickname(demoUser2.getNickname())
                        .build();
                postRepository.save(post4);

                log.info("초기 커뮤니티 데이터 및 데모 유저 생성 완료.");
            }
        };
    }
}
