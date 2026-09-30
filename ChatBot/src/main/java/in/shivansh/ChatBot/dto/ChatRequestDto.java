package in.shivansh.ChatBot.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRequestDto {
    private String message;

    public ChatRequestDto(String message){
        this.message = message;
    }
}
