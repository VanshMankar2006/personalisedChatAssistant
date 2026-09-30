package in.shivansh.ChatBot.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatResponseDto {
    private String response;

    public ChatResponseDto(String response){
        this.response=response;
    }
}
