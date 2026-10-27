package com.doubtdrop.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="doubts", indexes={@Index(name="idx_doubt_status",columnList="status"),@Index(name="idx_doubt_subject",columnList="subject")})
public class Doubt {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true,length=40) private String trackingCode;
 @Column(nullable=false,length=40) private String subject;
 @Column(nullable=false,length=160) private String title;
 @Column(length=2000) private String details;
 @Column(length=60) private String topic;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private DoubtStatus status=DoubtStatus.PENDING;
 @Column(length=3000) private String answer;
 @Column(nullable=false) private int votes=0;
 @Column(nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
 private LocalDateTime answeredAt;
 protected Doubt() {}
 public Doubt(String code,String subject,String title,String details,String topic) {
  this.trackingCode=code;this.subject=subject;this.title=title;this.details=details;this.topic=topic;
  this.status=DoubtStatus.PENDING;this.votes=0;this.createdAt=LocalDateTime.now();
 }
 public Long getId(){return id;} public String getTrackingCode(){return trackingCode;}
 public String getSubject(){return subject;} public String getTitle(){return title;}
 public String getDetails(){return details;} public String getTopic(){return topic;}
 public DoubtStatus getStatus(){return status;} public String getAnswer(){return answer;}
 public int getVotes(){return votes;} public LocalDateTime getCreatedAt(){return createdAt;}
 public LocalDateTime getAnsweredAt(){return answeredAt;}
 public void incrementVotes(){votes++;}
 public void setAnswer(String value){answer=value;status=(value==null||value.isBlank())?DoubtStatus.PENDING:DoubtStatus.ANSWERED;answeredAt=status==DoubtStatus.ANSWERED?LocalDateTime.now():null;}
 public void setStatus(DoubtStatus value){status=value;}
}
