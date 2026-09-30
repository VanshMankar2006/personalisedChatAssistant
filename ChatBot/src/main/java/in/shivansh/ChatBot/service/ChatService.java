package in.shivansh.ChatBot.service;

import in.shivansh.ChatBot.dto.ChatResponseDto;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {
    private final ChatClient chatClient;
    public ChatService(ChatClient.Builder chatClient) {
        this.chatClient = chatClient.build();
    }

    // to store the context/history
    List<Message> history = new ArrayList<>();
    private final String SYSTEM_PROMPT =
            """ 
                    You are a helpful customer-support executive for our
                    Cake ordering app named PUJA's Bakery.
                    
                    CORE ROLES AND SCOPE :-
                    - Respond ONLY to queries about PUJA's Bakery  Cake ordering , 
                       refund query, order tracking status query or company policy query.
                    - STRICT REFUSAL RULE : if user asked anything outside PUJA's Bakery
                       (e.g, coding ,general knowledge,sports,chit-chat,other business) immediately
                       decline with "I can only assist with cake orders, order tracking , refund and policies
                        for PUJA's Bakery
                    
                    OUTPUT RULES
                    - keep all response under 2 sentences maximum
                    - be concise,polite and direct
                    -use empathetic tone for issues
                    
                    keep the following thing in mind always...
                    -Do not provide explanation,code or background knowledge for off-topic questions
                       under any circumstances not related to cakes.
                    
                    """;

    public Flux<ChatResponseDto> chat(String message){
        // adding user message
        history.add(new UserMessage(message));
        StringBuilder full_response = new StringBuilder();

        //Flux<String> output = chatClient
        return chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .messages(history)
                //.call() -> for nonstreaming output
                .stream() // for streaming output
                .content()
                        .doOnNext( full_response::append)
                                .doOnComplete(()->{
                                    // adding assistant reply to history/context
                                    history.add(new AssistantMessage(full_response.toString()));
                                })
                .map(ChatResponseDto::new);


    }
}
