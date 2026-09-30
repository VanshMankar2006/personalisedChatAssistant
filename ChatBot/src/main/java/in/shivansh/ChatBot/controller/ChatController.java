package in.shivansh.ChatBot.controller;

import in.shivansh.ChatBot.dto.ChatRequestDto;
import in.shivansh.ChatBot.dto.ChatResponseDto;
import in.shivansh.ChatBot.service.ChatService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(value = "/chat" ,  produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ChatResponseDto>call(@RequestBody ChatRequestDto request){
        return chatService.chat(request.getMessage());
    }
}
