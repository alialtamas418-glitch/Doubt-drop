package com.doubtdrop.config;

import com.doubtdrop.model.Doubt;
import com.doubtdrop.model.DoubtStatus;
import com.doubtdrop.service.DoubtService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DoubtService service;

    public DataInitializer(DoubtService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        if (service.count() > 0) {
            return;
        }

        // Seed realistic college doubts for demonstration
        createDoubt(
                "DD-482910",
                "Java",
                "Difference between '==' and '.equals()' in Java Strings?",
                "I wrote String s1 = new String(\"hello\"); String s2 = new String(\"hello\"); and s1 == s2 returns false, but s1.equals(s2) returns true. Why does this happen, and how does the String Constant Pool relate to this?",
                "OOP / Strings",
                24,
                DoubtStatus.ANSWERED,
                "In Java:\n1. '==' tests reference equality (whether both variables point to the same memory address on the heap).\n2. '.equals()' tests content equality (whether both String instances represent the same characters).\n\nWhen using 'new String(\"hello\")', a new object is created on the heap outside the String Pool. If string literals 'String s1 = \"hello\"; String s2 = \"hello\";' were used instead, both would point to the same pooled instance, making s1 == s2 true."
        );

        createDoubt(
                "DD-194820",
                "Data Structures",
                "When should I use LinkedList vs ArrayList in Java?",
                "I know ArrayList is backed by a dynamic array and LinkedList is doubly-linked. In college tests we are asked about time complexities, but in practical programming when is LinkedList actually preferred?",
                "Collections / Time Complexity",
                31,
                DoubtStatus.ANSWERED,
                "Key comparison:\n- ArrayList: O(1) random access by index via get(i), amortized O(1) add at end. Insertion or removal in middle requires shifting elements (O(n)). Highly cache-friendly.\n- LinkedList: O(n) access by index. O(1) insert/delete once node reference is known. High memory overhead per node.\n\nRule of thumb: ArrayList is almost always faster in practice due to CPU cache locality. Use LinkedList (or ArrayDeque) mainly for FIFO queues or double-ended queues."
        );

        createDoubt(
                "DD-730194",
                "Database",
                "Can someone explain 1NF, 2NF, and 3NF with a simple student table example?",
                "Our DBMS professor asked for normal forms in the internal test. I keep mixing up partial dependency (2NF) and transitive dependency (3NF).",
                "Normalization / DBMS",
                19,
                DoubtStatus.ANSWERED,
                "Remember the classic summary: 'The key, the whole key, and nothing but the key, so help me Codd.'\n\n1. 1NF: Atomic values in each column; no repeating groups or lists in a single cell.\n2. 2NF: Must be in 1NF + every non-prime attribute must depend on the FULL candidate key, eliminating partial dependencies on composite keys.\n3. 3NF: Must be in 2NF + no non-prime attribute should transitively depend on the primary key through another non-prime attribute."
        );

        createDoubt(
                "DD-852109",
                "Operating Systems",
                "What are the 4 Coffman conditions for Deadlock, and how does Banker's Algorithm prevent it?",
                "We have an assignment on Deadlock Avoidance vs Deadlock Detection. Need a clear summary of how safe states work in Banker's algorithm.",
                "Deadlocks / OS",
                15,
                DoubtStatus.PENDING,
                null
        );

        createDoubt(
                "DD-619284",
                "Mathematics",
                "Intuitive way to understand Bayes' Theorem without memorizing formulas?",
                "P(A|B) = [P(B|A) * P(A)] / P(B). In clinical testing (false positives/negatives), why is the actual chance of having a rare disease often surprisingly low even with a 99% accurate test?",
                "Probability / Discrete Math",
                12,
                DoubtStatus.PENDING,
                null
        );

        createDoubt(
                "DD-304918",
                "Web Development",
                "Why do browsers block requests with CORS error even when Postman works?",
                "When I call my backend from http://localhost:3000 to http://localhost:8080, browser console says: 'No Access-Control-Allow-Origin header is present'. But sending the same GET request in Postman or curl succeeds instantly. Why?",
                "REST API / Security",
                28,
                DoubtStatus.ANSWERED,
                "Postman is a developer tool and does not enforce the browser's Same-Origin Policy (SOP). Web browsers enforce SOP to protect users from malicious sites reading sensitive data from other sites using their stored credentials.\n\nTo allow browser access, the backend server must include the 'Access-Control-Allow-Origin: http://localhost:3000' header in its response."
        );
    }

    private void createDoubt(String code, String subject, String title, String details, String topic, int votes, DoubtStatus status, String answer) {
        Doubt d = new Doubt(code, subject, title, details, topic);
        for (int i = 0; i < votes; i++) {
            d.incrementVotes();
        }
        if (answer != null) {
            d.setAnswer(answer);
        }
        d.setStatus(status);
        service.save(d);
    }
}
